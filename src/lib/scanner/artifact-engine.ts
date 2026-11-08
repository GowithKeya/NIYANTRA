import { validateFileType, safeExtractText, CoverageStatus } from './file-registry';
import { calculateRiskIndex, SeverityLevel, RiskFindingInput } from './risk-calculator';

export interface ArtifactFinding {
  id: string;
  category: 'AWS_GCP_KEYS' | 'PRIVATE_KEYS' | 'SQLI_DESTRUCTIVE' | 'PROMPT_INJECTION' | 'JWT_BEARER' | 'INTERNAL_IP_EGRESS' | 'PII_SECRETS';
  title: string;
  severity: SeverityLevel;
  confidence: number;
  lineNumber?: number;
  rawMatchSnippet: string;
  redactedEvidence: string;
  remediation: string;
  description: string;
}

export interface ArtifactInspectionResult {
  fileName: string;
  executedFilesCount: number; // Strictly 0
  coverageStatus: CoverageStatus;
  fileSizeBytes: number;
  riskIndex: number;
  findings: ArtifactFinding[];
  geminiStatus: 'SKIPPED' | 'FAILED' | 'ANALYZED';
  geminiReason?: string;
  geminiSummary?: string;
  cleanTextRedacted: string;
  inspectedAt: string;
}

interface PatternRule {
  id: string;
  category: ArtifactFinding['category'];
  title: string;
  severity: SeverityLevel;
  confidence: number;
  regex: RegExp;
  description: string;
  remediation: string;
  redact: (match: string, p1?: string, ...rest: any[]) => string;
}

const BASELINE_RULES: PatternRule[] = [
  // 1. AWS / GCP Keys - Secret Keys first, then Access Key IDs
  {
    id: 'SEC-002',
    category: 'AWS_GCP_KEYS',
    title: 'Hardcoded AWS Secret Access Key Detected',
    severity: 'Critical',
    confidence: 1.0,
    regex: /((?:aws_secret_access_key|aws_secret_key|secret_key)\s*[:=]\s*["']?)([A-Za-z0-9/+=]{20,40})(["']?)/gi,
    description: 'Found raw AWS Secret Access Key assignment.',
    remediation: 'Immediately invalidate the compromised secret key in AWS IAM. Never store secrets in source or artifact trees.',
    redact: (_match, p1, _p2) => `${p1 || 'aws_secret_access_key='}[REDACTED]`
  },
  {
    id: 'SEC-001',
    category: 'AWS_GCP_KEYS',
    title: 'Hardcoded AWS Access Key ID Detected',
    severity: 'High',
    confidence: 1.0,
    regex: /\b(AKIA[0-9A-Z]{16})\b/g,
    description: 'Found AWS standard Access Key ID in artifact content.',
    remediation: 'Revoke key in AWS IAM Console immediately. Migrate credential to AWS Secrets Manager or IAM Instance Roles.',
    redact: (match) => match.replace(/AKIA[0-9A-Z]{16}/, 'AKIA[REDACTED_AWS_KEY]')
  },
  {
    id: 'SEC-003',
    category: 'AWS_GCP_KEYS',
    title: 'GCP Service Account / API Key Detected',
    severity: 'High',
    confidence: 1.0,
    regex: /\b(AIza[0-9A-Za-z-_]{35})\b/g,
    description: 'Found Google Cloud API key string matching standard prefix.',
    remediation: 'Restrict key in Google Cloud Console to specific APIs and authorized referrers. Store in Secret Manager.',
    redact: () => 'AIza[REDACTED_GCP_KEY]'
  },

  // 2. Private Keys
  {
    id: 'SEC-004',
    category: 'PRIVATE_KEYS',
    title: 'Cryptographic Private Key Block Detected',
    severity: 'Critical',
    confidence: 1.0,
    regex: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE\s+KEY-----/gi,
    description: 'Embedded asymmetric private key found in artifact body.',
    remediation: 'Remove private key immediately. Rotate corresponding public keys on all servers. Use SSH agent or HashiCorp Vault.',
    redact: () => '-----BEGIN PRIVATE KEY-----\n[REDACTED_PRIVATE_KEY_MATERIAL]\n-----END PRIVATE KEY-----'
  },

  // 3. SQLi / Destructive Commands
  {
    id: 'SEC-005',
    category: 'SQLI_DESTRUCTIVE',
    title: 'Destructive SQL Execution Pattern',
    severity: 'Critical',
    confidence: 0.95,
    regex: /\b(DROP\s+(?:DATABASE|TABLE)\s+[a-zA-Z0-9_]+|TRUNCATE\s+TABLE\s+[a-zA-Z0-9_]+|DELETE\s+FROM\s+[a-zA-Z0-9_]+\s*;?)/gi,
    description: 'Potentially catastrophic database drop/truncate/delete command detected.',
    remediation: 'Audit pipeline permissions. Enforce read-only replicas and parameter binding. Prevent raw SQL execution by agents.',
    redact: (match) => `[REDACTED_DESTRUCTIVE_SQL: ${match.slice(0, 15)}...]`
  },
  {
    id: 'SEC-006',
    category: 'SQLI_DESTRUCTIVE',
    title: 'Destructive Shell Filesystem Command',
    severity: 'Critical',
    confidence: 1.0,
    regex: /\b(rm\s+-(?:r[fv]|f[rv]|[rvf]{2,3})\s+(?:\/|~|\$HOME|\.\*|\*)|mkfs(?:\.[a-z0-9]+)?\s+\/dev\/|:(){ :|:& };:)/gi,
    description: 'Destructive filesystem deletion or fork bomb shell command detected.',
    remediation: 'Ensure sandboxing container isolation and read-only root filesystems.',
    redact: (match) => `[REDACTED_DESTRUCTIVE_COMMAND: ${match.slice(0, 10)}...]`
  },

  // 4. Prompt Injection Markers
  {
    id: 'SEC-007',
    category: 'PROMPT_INJECTION',
    title: 'Prompt Injection / System Prompt Override Marker',
    severity: 'High',
    confidence: 0.9,
    regex: /(?:\b(?:ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions|disregard\s+(?:all\s+prior|the\s+above|system\s+prompt)|DAN\s+mode|jailbreak|act\s+as\s+an\s+unfiltered|override\s+system\s+directives|system\s*:\s*you\s+are\s+now|developer\s+mode\s+enabled)\b)/gi,
    description: 'Heuristic pattern matching adversarial prompt injection phrases attempting to subvert LLM instructions.',
    remediation: 'Quarantine artifact. Separate system instruction boundaries from untrusted document ingestion.',
    redact: (match) => `[PROMPT_INJECTION_MARKER: ${match}]`
  },

  // 5. Hardcoded JWT / Bearer Tokens
  {
    id: 'SEC-008',
    category: 'JWT_BEARER',
    title: 'Hardcoded JSON Web Token (JWT) Detected',
    severity: 'High',
    confidence: 0.95,
    regex: /\b(eyJ[A-Za-z0-9-_]{10,}\.eyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,})\b/g,
    description: 'Found signed or unsigned JSON Web Token credentials.',
    remediation: 'Ensure tokens are ephemeral, issued via OAuth2/OIDC, and never committed into static files or agent context.',
    redact: () => 'eyJ[REDACTED_JWT_HEADER].[REDACTED_PAYLOAD].[REDACTED_SIGNATURE]'
  },
  {
    id: 'SEC-009',
    category: 'JWT_BEARER',
    title: 'Authorization Bearer Header / API Token',
    severity: 'High',
    confidence: 0.9,
    regex: /(Bearer\s+)([a-zA-Z0-9_\-\.]{25,})/gi,
    description: 'Static Authorization Bearer token discovered.',
    remediation: 'Rotate token immediately and fetch authorization dynamically at runtime.',
    redact: () => 'Bearer [REDACTED_TOKEN]'
  },

  // 6. Internal IP / SSRF / Unapproved Egress URLs
  {
    id: 'SEC-010',
    category: 'INTERNAL_IP_EGRESS',
    title: 'Cloud Metadata Service / Internal Private IP Egress Target',
    severity: 'Critical',
    confidence: 1.0,
    regex: /https?:\/\/(?:169\.254\.169\.254|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|127\.0\.0\.1|localhost)(?::\d+)?(?:\/[^\s"']*)?/gi,
    description: 'Detected link targeting cloud metadata endpoint (169.254.169.254) or RFC 1918 private subnet.',
    remediation: 'Block private/metadata IP egress at the network gateway layer (IMDSv2 required for AWS).',
    redact: (match) => `[REDACTED_INTERNAL_DESTINATION: ${match.slice(0, 15)}...]`
  },
  {
    id: 'SEC-011',
    category: 'INTERNAL_IP_EGRESS',
    title: 'Unapproved Data Exfiltration Webhook',
    severity: 'High',
    confidence: 0.9,
    regex: /https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:webhook\.site|ngrok\.io|pipedream\.net|requestcatcher\.com|burpcollaborator\.net)(?:\/[^\s"']*)?/gi,
    description: 'Artifact references known public request capture / tunnel service frequently used in exfiltration attacks.',
    remediation: 'Enforce strict network egress allowlisting. Block unauthorized outbound webhook targets.',
    redact: (match) => `[REDACTED_EXFILTRATION_URL: ${match.slice(0, 20)}...]`
  },

  // 7. PII / Sensitive Secret Patterns
  {
    id: 'SEC-012',
    category: 'PII_SECRETS',
    title: 'US Social Security Number (SSN) Pattern',
    severity: 'Critical',
    confidence: 0.85,
    regex: /\b(\d{3}-\d{2}-\d{4})\b/g,
    description: 'Discovered string matching US Social Security Number format.',
    remediation: 'Comply with privacy DLP requirements. Mask or redact PII before artifact storage or LLM ingestion.',
    redact: () => 'XXX-XX-[REDACTED_SSN]'
  },
  {
    id: 'SEC-013',
    category: 'PII_SECRETS',
    title: 'Credit / Debit Card Number Pattern',
    severity: 'High',
    confidence: 0.85,
    regex: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
    description: 'Matched 16-digit payment card format.',
    remediation: 'Redact payment data immediately to satisfy PCI-DSS compliance requirements.',
    redact: () => 'XXXX-XXXX-XXXX-[REDACTED_CARD]'
  },
  {
    id: 'SEC-014',
    category: 'PII_SECRETS',
    title: 'Generic Hardcoded Password / Secret Assignment',
    severity: 'Medium',
    confidence: 0.8,
    regex: /((?:password|passwd|db_pass|secret_token|auth_secret)\s*[:=]\s*["']?)([^\s"']{8,})(["']?)/gi,
    description: 'Plaintext secret variable assignment discovered.',
    remediation: 'Inject secrets via environment variables or secret store at runtime.',
    redact: (_match, p1) => `${p1 || 'password='}[REDACTED_SECRET]`
  }
];

export interface InspectArtifactOptions {
  enableGemini?: boolean;
  apiKey?: string;
}

/**
 * Checkpoint 1: Artifact Review Pipeline.
 * Guarantee: 0 Uploaded Files Executed.
 */
export async function inspectArtifact(
  fileOrContent: string | ArrayBuffer | Uint8Array | File | Blob | { name: string; text?: string | (() => Promise<string>); content?: string },
  options: InspectArtifactOptions = {}
): Promise<ArtifactInspectionResult> {
  let fileName = 'artifact.txt';
  let rawContent: string | ArrayBuffer | Uint8Array = '';

  if (typeof File !== 'undefined' && fileOrContent instanceof File) {
    fileName = fileOrContent.name;
    rawContent = await fileOrContent.text();
  } else if (typeof Blob !== 'undefined' && fileOrContent instanceof Blob) {
    fileName = 'name' in fileOrContent ? String((fileOrContent as { name?: unknown }).name || 'artifact.txt') : 'artifact.txt';
    rawContent = await fileOrContent.text();
  } else if (typeof fileOrContent === 'object' && fileOrContent !== null && 'name' in fileOrContent) {
    const obj = fileOrContent as { name: string; text?: string | (() => Promise<string>); content?: string };
    fileName = obj.name;
    if (typeof obj.text === 'function') {
      rawContent = await obj.text();
    } else {
      rawContent = (obj.text ?? obj.content ?? '') as string;
    }
  } else if (typeof fileOrContent === 'string') {
    rawContent = fileOrContent;
  } else {
    rawContent = fileOrContent as ArrayBuffer | Uint8Array;
  }

  // File type validation & safety check
  const fileValidation = validateFileType(fileName);
  const extraction = await safeExtractText(rawContent, fileName);

  const findings: ArtifactFinding[] = [];
  let redactedText = extraction.text;
  const lines = extraction.text.split('\n');

  // Run 7 Deterministic Baseline Rules
  for (const rule of BASELINE_RULES) {
    rule.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = rule.regex.exec(extraction.text)) !== null) {
      const matchedString = match[0];
      const matchIndex = match.index;

      // Calculate line number
      const lineNum = extraction.text.substring(0, matchIndex).split('\n').length;
      const snippet = lines[lineNum - 1] ?? matchedString;

      // Generate redacted version of snippet and evidence using a cloned regex so rule.regex.lastIndex is not corrupted
      const cloneRegex = new RegExp(rule.regex.source, rule.regex.flags);
      const redactedSnippet = snippet.replace(cloneRegex, (...args) => rule.redact(args[0], args[1], args[2]));

      findings.push({
        id: `${rule.id}-${findings.length + 1}`,
        category: rule.category,
        title: rule.title,
        severity: rule.severity,
        confidence: rule.confidence,
        lineNumber: lineNum,
        rawMatchSnippet: snippet.trim(),
        redactedEvidence: redactedSnippet.trim(),
        remediation: rule.remediation,
        description: rule.description
      });

      // Avoid infinite loop on zero-length matches
      if (match.index === rule.regex.lastIndex) {
        rule.regex.lastIndex++;
      }
    }

    // Apply global redaction to cleanText
    rule.regex.lastIndex = 0;
    redactedText = redactedText.replace(
      new RegExp(rule.regex.source, rule.regex.flags),
      (...args) => rule.redact(args[0], args[1], args[2])
    );
  }

  // Calculate Risk Index (Severity x Confidence Diminishing Returns)
  const riskIndexInputs: RiskFindingInput[] = findings.map((f) => ({
    severity: f.severity,
    confidence: f.confidence
  }));
  const riskIndex = calculateRiskIndex(riskIndexInputs);

  // Gemini Inspection Resilience (Build Lesson 02: A key in a local file != a live review)
  let geminiStatus: ArtifactInspectionResult['geminiStatus'] = 'SKIPPED';
  let geminiReason: string | undefined = undefined;
  let geminiSummary: string | undefined = undefined;

  if (!options.enableGemini) {
    geminiStatus = 'SKIPPED';
    geminiReason = 'User opt-in for Server-Side Gemini API review was disabled (zero outbound telemetry).';
  } else if (!options.apiKey || options.apiKey.trim() === '') {
    geminiStatus = 'SKIPPED';
    geminiReason = 'Gemini API key is not configured or empty. Gracefully skipped without blocking.';
  } else {
    try {
      // Lazy call Gemini SDK or fail gracefully
      const { runGeminiInspection } = await import('./gemini-inspector');
      const geminiResult = await runGeminiInspection(redactedText, options.apiKey);
      geminiStatus = geminiResult.status;
      geminiReason = geminiResult.reason;
      geminiSummary = geminiResult.summary;
    } catch (err: unknown) {
      geminiStatus = 'FAILED';
      geminiReason = `Gemini review failed: ${err instanceof Error ? err.message : 'Network/quota error'}`;
    }
  }

  return {
    fileName,
    executedFilesCount: 0, // Guarantee: 0 uploaded files executed
    coverageStatus: extraction.coverage,
    fileSizeBytes: extraction.byteLength,
    riskIndex,
    findings,
    geminiStatus,
    geminiReason,
    geminiSummary,
    cleanTextRedacted: redactedText,
    inspectedAt: new Date().toISOString()
  };
}
