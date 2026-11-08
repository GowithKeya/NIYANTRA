import { ProposedToolCall, AgentEvaluationTrace } from './types';

const METADATA_IP_PATTERNS = [
  /169\.254\.169\.254/,
  /metadata\.google\.internal/,
  /fd00:ec2::254/
];

const EXFILTRATION_HOSTS = [
  'webhook.site',
  'ngrok.io',
  'ngrok-free.app',
  'pipedream.net',
  'requestcatcher.com',
  'burpcollaborator.net',
  'pastebin.com'
];

const APPROVED_EGRESS_HOSTS = [
  'api.internal.company.com',
  'vault.internal.corp',
  'storage.internal.corp',
  'github.com',
  'api.github.com',
  'registry.npmjs.org',
  'pypi.org',
  'huggingface.co'
];

export function evaluateEchoEgress(
  proposedTool: ProposedToolCall,
  destinationInput?: string
): AgentEvaluationTrace {
  const indicators: string[] = [];
  const target = (destinationInput || proposedTool.destination || '').trim();
  const argsString = typeof proposedTool.arguments === 'string'
    ? proposedTool.arguments
    : JSON.stringify(proposedTool.arguments || {});

  const combinedTargets = `${target} ${argsString}`;

  // 1. SSRF & Cloud Metadata Protection
  for (const pattern of METADATA_IP_PATTERNS) {
    if (pattern.test(combinedTargets)) {
      indicators.push(`Cloud metadata endpoint detected: "${pattern.source}"`);
      return {
        agent: 'Echo',
        status: 'BLOCK',
        reason: 'Egress Violation: Attempt to query AWS/GCP/Azure instance metadata service (SSRF / credential theft).',
        confidence: 1.0,
        indicators,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 2. Known Exfiltration Webhooks
  for (const host of EXFILTRATION_HOSTS) {
    if (combinedTargets.includes(host)) {
      indicators.push(`Target matches high-risk exfiltration tunnel: "${host}"`);
      return {
        agent: 'Echo',
        status: 'BLOCK',
        reason: `Egress Violation: Target destination "${host}" is an unapproved public capture/tunneling service.`,
        confidence: 1.0,
        indicators,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 3. Public / Unverified S3 Bucket Targets
  if (/s3:\/\/(?:public|external|temp|untrusted|leak)/i.test(combinedTargets) ||
      /https?:\/\/[a-z0-9.-]+\.s3\.amazonaws\.com/i.test(combinedTargets)) {
    indicators.push('External or untrusted S3 bucket egress target detected.');
    return {
      agent: 'Echo',
      status: 'REVIEW',
      reason: 'Egress Warning: Data egress to external S3 bucket requires policy exception approval.',
      confidence: 0.9,
      indicators,
      timestamp: new Date().toISOString()
    };
  }

  // 4. RFC 1918 Private IP destinations without explicit approval
  const rfc1918Match = combinedTargets.match(/https?:\/\/(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})/);
  if (rfc1918Match) {
    indicators.push(`Direct private subnet IP access: ${rfc1918Match[0]}`);
    return {
      agent: 'Echo',
      status: 'REVIEW',
      reason: `Egress to internal RFC 1918 subnet (${rfc1918Match[0]}) requires network proxy verification.`,
      confidence: 0.85,
      indicators,
      timestamp: new Date().toISOString()
    };
  }

  // 5. Approved Host or Internal Tool
  const isApproved = APPROVED_EGRESS_HOSTS.some((host) => target.includes(host));
  if (isApproved || !target || target.startsWith('internal://') || target.startsWith('local://')) {
    return {
      agent: 'Echo',
      status: 'ALLOW',
      reason: 'Egress destination verified within approved network perimeter.',
      confidence: 1.0,
      indicators: [target ? `Target ${target} matches allowlist.` : 'Local/internal tool call without external network egress.'],
      timestamp: new Date().toISOString()
    };
  }

  // If external URL but not on allowlist
  if (target.startsWith('http://') || target.startsWith('https://')) {
    indicators.push(`Unverified external target: ${target}`);
    return {
      agent: 'Echo',
      status: 'REVIEW',
      reason: `Destination "${target}" is outside standard allowlist; requires Human-in-the-Loop review.`,
      confidence: 0.8,
      indicators,
      timestamp: new Date().toISOString()
    };
  }

  return {
    agent: 'Echo',
    status: 'ALLOW',
    reason: 'Destination egress boundaries cleared.',
    confidence: 1.0,
    indicators: ['Allowlist check complete.'],
    timestamp: new Date().toISOString()
  };
}

