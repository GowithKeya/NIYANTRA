export type AgentRole = 'guest' | 'engineer' | 'admin';

export interface UserIdentity {
  userId: string;
  role: AgentRole;
  orgId?: string;
  permissions?: string[];
}

export interface ProposedToolCall {
  name: string;
  arguments: Record<string, unknown> | string;
  destination?: string;
}

export type PolicyDecisionStatus = 'ALLOW' | 'BLOCK' | 'REVIEW';

export interface AgentEvaluationTrace {
  agent: 'Cut' | 'Hue' | 'Nova' | 'Echo' | 'Flow';
  status: PolicyDecisionStatus;
  reason: string;
  confidence: number;
  indicators: string[];
  redactedContext?: string;
  timestamp: string;
}

export interface ImmutableAuditRecord {
  id: string;
  actionFingerprint: string;
  userId: string;
  userRole: AgentRole;
  toolName: string;
  decision: PolicyDecisionStatus;
  decisionReason: string;
  flowApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  timestamp: string;
}

export interface ActionGatewayInput {
  identity: UserIdentity;
  originalIntent: string;
  proposedTool: ProposedToolCall;
  contextNotes?: string;
}

export interface ActionGatewayDecision {
  status: PolicyDecisionStatus;
  primaryReason: string;
  riskScore: number;
  agentTraces: {
    Cut: AgentEvaluationTrace;
    Hue: AgentEvaluationTrace;
    Nova: AgentEvaluationTrace;
    Echo: AgentEvaluationTrace;
    Flow: AgentEvaluationTrace;
  };
  auditRecord: ImmutableAuditRecord;
  evaluatedAt: string;
}

