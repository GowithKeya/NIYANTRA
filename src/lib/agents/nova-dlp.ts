import { ProposedToolCall, AgentEvaluationTrace } from './types';

const SECRET_PATTERNS = [
  {
    name: 'AWS Access Key',
    regex: /\b(AKIA[0-9A-Z]{16})\b/g,
    redact: () => 'AKIA[REDACTED_AWS_KEY]',
    severity: 'HIGH'
  },
  {
    name: 'AWS Secret Key',
    regex: /(aws_secret_access_key|aws_secret_key|secret_key)\s*[:=]\s*["']?([A-Za-z0-9/+=]{20,40})["']?/gi,
    redact: (_m: string, p1: string) => `${p1 || 'aws_secret_access_key'}=[REDACTED]`,
    severity: 'CRITICAL'
  },
  {
    name: 'GCP API Key',
    regex: /\b(AIza[0-9A-Za-z-_]{35})\b/g,
    redact: () => 'AIza[REDACTED_GCP_KEY]',
    severity: 'HIGH'
  },
  {
    name: 'Private Key Block',
    regex: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE\s+KEY-----/gi,
    redact: () => '-----BEGIN PRIVATE KEY-----\n[REDACTED_KEY_MATERIAL]\n-----END PRIVATE KEY-----',
    severity: 'CRITICAL'
  },
  {
    name: 'JWT Token',
    regex: /\b(eyJ[A-Za-z0-9-_]{10,}\.eyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,})\b/g,
    redact: () => 'eyJ[REDACTED_JWT]',
    severity: 'HIGH'
  },
  {
    name: 'Bearer Token',
    regex: /Bearer\s+[a-zA-Z0-9_\-\.]{25,}/gi,
    redact: () => 'Bearer [REDACTED_BEARER]',
    severity: 'HIGH'
  },
  {
    name: 'US SSN',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    redact: () => 'XXX-XX-[REDACTED_SSN]',
    severity: 'CRITICAL'
  },
  {
    name: 'Credit Card',
    regex: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
    redact: () => 'XXXX-XXXX-XXXX-[REDACTED_CARD]',
    severity: 'HIGH'
  }
];

export function evaluateNovaDlp(
  proposedTool: ProposedToolCall,
  originalIntent: string
): AgentEvaluationTrace {
  const indicators: string[] = [];
  const argsString = typeof proposedTool.arguments === 'string'
    ? proposedTool.arguments
    : JSON.stringify(proposedTool.arguments || {});

  const fullText = `${originalIntent}\n${argsString}`;
  let redacted = fullText;
  let hasCriticalLeak = false;
  let hasHighLeak = false;

  for (const item of SECRET_PATTERNS) {
    item.regex.lastIndex = 0;
    if (item.regex.test(fullText)) {
      indicators.push(`DLP match: ${item.name} detected in tool arguments/context.`);
      if (item.severity === 'CRITICAL') {
        hasCriticalLeak = true;
      } else {
        hasHighLeak = true;
      }
      item.regex.lastIndex = 0;
      redacted = redacted.replace(item.regex, item.redact);
    }
  }

  if (hasCriticalLeak) {
    return {
      agent: 'Nova',
      status: 'BLOCK',
      reason: 'DLP Violation: Critical credentials, private keys, or PII detected in proposed tool payload.',
      confidence: 1.0,
      indicators,
      redactedContext: redacted.slice(0, 500),
      timestamp: new Date().toISOString()
    };
  }

  if (hasHighLeak) {
    return {
      agent: 'Nova',
      status: 'REVIEW',
      reason: 'Sensitive API token or credential string detected in tool arguments. Requires security sign-off.',
      confidence: 0.9,
      indicators,
      redactedContext: redacted.slice(0, 500),
      timestamp: new Date().toISOString()
    };
  }

  return {
    agent: 'Nova',
    status: 'ALLOW',
    reason: 'Zero credentials, private keys, or unredacted PII detected in tool payload.',
    confidence: 1.0,
    indicators: ['Payload DLP inspection passed cleanly.'],
    redactedContext: redacted.slice(0, 300),
    timestamp: new Date().toISOString()
  };
}
