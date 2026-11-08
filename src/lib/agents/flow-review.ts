import {
  AgentEvaluationTrace,
  ActionGatewayInput,
  PolicyDecisionStatus,
  ImmutableAuditRecord
} from './types';

// In-memory persistent queue for the prototype session
let AUDIT_LOG_STORE: ImmutableAuditRecord[] = [];

/**
 * Creates a deterministic SHA-like hash fingerprint from action parameters.
 */
function createActionFingerprint(input: ActionGatewayInput, timestamp: string): string {
  const payload = `${input.identity.userId}:${input.identity.role}:${input.proposedTool.name}:${input.originalIntent}:${timestamp}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}${Date.now().toString(16).slice(-6)}`;
}

export function evaluateFlowReview(
  traces: {
    Cut: AgentEvaluationTrace;
    Hue: AgentEvaluationTrace;
    Nova: AgentEvaluationTrace;
    Echo: AgentEvaluationTrace;
  },
  input: ActionGatewayInput
): {
  flowTrace: AgentEvaluationTrace;
  overallStatus: PolicyDecisionStatus;
  primaryReason: string;
  auditRecord: ImmutableAuditRecord;
} {
  const timestamp = new Date().toISOString();
  const subTraces = [traces.Cut, traces.Hue, traces.Nova, traces.Echo];
  const blockTraces = subTraces.filter((t) => t.status === 'BLOCK');
  const reviewTraces = subTraces.filter((t) => t.status === 'REVIEW');

  let overallStatus: PolicyDecisionStatus = 'ALLOW';
  let primaryReason = 'Action verified safe by all checkpoint agents (Cut, Hue, Nova, Echo).';
  const indicators: string[] = [];

  if (blockTraces.length > 0) {
    overallStatus = 'BLOCK';
    const blockingAgents = blockTraces.map((t) => `${t.agent} (${t.reason})`).join('; ');
    primaryReason = `Action blocked by policy: ${blockingAgents}`;
    indicators.push(...blockTraces.flatMap((t) => t.indicators));
  } else if (reviewTraces.length > 0) {
    overallStatus = 'REVIEW';
    const reviewAgents = reviewTraces.map((t) => `${t.agent} (${t.reason})`).join('; ');
    primaryReason = `Human-in-the-Loop review triggered: ${reviewAgents}`;
    indicators.push(...reviewTraces.flatMap((t) => t.indicators));
  } else {
    indicators.push('Deterministic pass through all 4 pre-flight inspection nodes.');
  }

  const flowTrace: AgentEvaluationTrace = {
    agent: 'Flow',
    status: overallStatus,
    reason: overallStatus === 'REVIEW'
      ? 'Action staged in Human-in-the-Loop approval queue pending security sign-off.'
      : overallStatus === 'BLOCK'
      ? 'Flow finalized deterministic BLOCK policy. Audit entry registered.'
      : 'Flow cleared action for autonomous execution.',
    confidence: 1.0,
    indicators,
    timestamp
  };

  const auditRecord: ImmutableAuditRecord = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    actionFingerprint: createActionFingerprint(input, timestamp),
    userId: input.identity.userId,
    userRole: input.identity.role,
    toolName: input.proposedTool.name,
    decision: overallStatus,
    decisionReason: primaryReason,
    flowApprovalStatus: overallStatus === 'REVIEW' ? 'PENDING' : overallStatus === 'ALLOW' ? 'APPROVED' : 'REJECTED',
    timestamp
  };

  // Prepend to audit store
  AUDIT_LOG_STORE.unshift(auditRecord);

  return {
    flowTrace,
    overallStatus,
    primaryReason,
    auditRecord
  };
}

export function updateFlowApproval(
  auditId: string,
  decision: 'APPROVED' | 'REJECTED',
  actorName: string,
  rejectionReason?: string
): ImmutableAuditRecord | null {
  const record = AUDIT_LOG_STORE.find((r) => r.id === auditId);
  if (!record) return null;

  record.flowApprovalStatus = decision;
  record.approvedBy = actorName;
  record.approvedAt = new Date().toISOString();
  if (rejectionReason) {
    record.rejectionReason = rejectionReason;
  }
  return record;
}

export function getAuditLogStore(): ImmutableAuditRecord[] {
  return [...AUDIT_LOG_STORE];
}

