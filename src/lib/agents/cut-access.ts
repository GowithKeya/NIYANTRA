import { UserIdentity, ProposedToolCall, AgentEvaluationTrace, PolicyDecisionStatus } from './types';

const GUEST_ALLOWED_TOOLS = new Set([
  'document_search',
  'read_faq',
  'get_system_status',
  'lookup_public_docs',
  'calculator',
  'view_catalog'
]);

const DESTRUCTIVE_KEYWORDS = [
  'delete',
  'drop',
  'truncate',
  'destroy',
  'rm -rf',
  'terminate',
  'purge',
  'shutdown',
  'wipe'
];

export function evaluateCutAccess(
  identity: UserIdentity,
  proposedTool: ProposedToolCall,
  originalIntent: string
): AgentEvaluationTrace {
  const role = identity.role || 'guest';
  const toolName = proposedTool.name.toLowerCase();
  const rawIntent = originalIntent.toLowerCase();
  const argsString = typeof proposedTool.arguments === 'string'
    ? proposedTool.arguments
    : JSON.stringify(proposedTool.arguments || {});

  const indicators: string[] = [];

  // 1. Guest Role Policy Enforcement
  if (role === 'guest') {
    // Check tool allowlist
    if (!GUEST_ALLOWED_TOOLS.has(toolName)) {
      indicators.push(`Tool "${proposedTool.name}" is not permitted for Guest identity.`);
      return {
        agent: 'Cut',
        status: 'BLOCK',
        reason: `RBAC Violation: Role "guest" lacks permission to execute "${proposedTool.name}".`,
        confidence: 1.0,
        indicators,
        timestamp: new Date().toISOString()
      };
    }

    // Check if intent or arguments contain destructive operations
    const hasDestructiveIntent = DESTRUCTIVE_KEYWORDS.some((kw) =>
      rawIntent.includes(kw) || argsString.toLowerCase().includes(kw)
    );

    if (hasDestructiveIntent) {
      indicators.push('Destructive action requested while authenticated with Guest role.');
      return {
        agent: 'Cut',
        status: 'BLOCK',
        reason: `Least-Privilege Boundary Violation: Guest identity attempted destructive operation (${toolName}).`,
        confidence: 1.0,
        indicators,
        timestamp: new Date().toISOString()
      };
    }

    return {
      agent: 'Cut',
      status: 'ALLOW',
      reason: `Guest role authorized for safe read-only tool "${proposedTool.name}".`,
      confidence: 1.0,
      indicators: ['Within least-privilege boundary.'],
      timestamp: new Date().toISOString()
    };
  }

  // 2. Engineer Role Policy Enforcement
  if (role === 'engineer') {
    // Engineers cannot perform unmitigated production drops or root shell execution
    const isProductionTarget =
      rawIntent.includes('production') ||
      rawIntent.includes('prod_') ||
      argsString.toLowerCase().includes('production') ||
      (proposedTool.destination && proposedTool.destination.includes('prod'));

    const isDestructive = DESTRUCTIVE_KEYWORDS.some((kw) =>
      rawIntent.includes(kw) || argsString.toLowerCase().includes(kw) || toolName.includes(kw)
    );

    if (isProductionTarget && isDestructive) {
      indicators.push('Engineer role attempted destructive change against production target.');
      return {
        agent: 'Cut',
        status: 'BLOCK',
        reason: 'RBAC Policy: Direct destructive actions on production environments are restricted for Engineers without Admin approval.',
        confidence: 0.95,
        indicators,
        timestamp: new Date().toISOString()
      };
    }

    if (toolName === 'execute_root_bash' || toolName === 'export_all_credentials') {
      indicators.push('Restricted administrative tool.');
      return {
        agent: 'Cut',
        status: 'BLOCK',
        reason: `Tool "${proposedTool.name}" requires Admin role authorization.`,
        confidence: 1.0,
        indicators,
        timestamp: new Date().toISOString()
      };
    }

    if (isDestructive) {
      return {
        agent: 'Cut',
        status: 'REVIEW',
        reason: `Destructive operation "${proposedTool.name}" on non-production target requires verification.`,
        confidence: 0.85,
        indicators: ['Destructive tool execution requested by Engineer.'],
        timestamp: new Date().toISOString()
      };
    }

    return {
      agent: 'Cut',
      status: 'ALLOW',
      reason: `Role "engineer" authorized for tool "${proposedTool.name}".`,
      confidence: 1.0,
      indicators: ['Access boundary verified.'],
      timestamp: new Date().toISOString()
    };
  }

  // 3. Admin Role Policy Enforcement
  if (role === 'admin') {
    const isHighImpactDestructive = DESTRUCTIVE_KEYWORDS.some((kw) =>
      rawIntent.includes(kw) || argsString.toLowerCase().includes(kw)
    );

    if (isHighImpactDestructive) {
      return {
        agent: 'Cut',
        status: 'REVIEW',
        reason: 'Administrative destructive operation requires four-eyes HITL review via Flow.',
        confidence: 0.9,
        indicators: ['High-impact administrative action flagged for governance.'],
        timestamp: new Date().toISOString()
      };
    }

    return {
      agent: 'Cut',
      status: 'ALLOW',
      reason: 'Admin role verified with elevated operational boundaries.',
      confidence: 1.0,
      indicators: ['Admin boundary granted.'],
      timestamp: new Date().toISOString()
    };
  }

  return {
    agent: 'Cut',
    status: 'BLOCK',
    reason: `Unrecognized user role "${role}".`,
    confidence: 1.0,
    indicators: ['Invalid identity role.'],
    timestamp: new Date().toISOString()
  };
}

