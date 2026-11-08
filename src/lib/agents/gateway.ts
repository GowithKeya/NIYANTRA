import { ActionGatewayInput, ActionGatewayDecision } from './types';
import { evaluateCutAccess } from './cut-access';
import { evaluateHuePrompt } from './hue-prompt';
import { evaluateNovaDlp } from './nova-dlp';
import { evaluateEchoEgress } from './echo-egress';
import { evaluateFlowReview } from './flow-review';
import { calculateRiskIndex, SeverityLevel } from '../scanner/risk-calculator';

export async function evaluateActionGateway(
  input: ActionGatewayInput
): Promise<ActionGatewayDecision> {
  // Step 1: Run Cut (Access Boundaries & RBAC)
  const cutTrace = evaluateCutAccess(input.identity, input.proposedTool, input.originalIntent);

  // Step 2: Run Hue (Prompt, Injections & Intent Laundering)
  const hueTrace = evaluateHuePrompt(input.originalIntent, input.proposedTool);

  // Step 3: Run Nova (DLP, Secrets & PII)
  const novaTrace = evaluateNovaDlp(input.proposedTool, input.originalIntent);

  // Step 4: Run Echo (Destinations & Egress)
  const echoTrace = evaluateEchoEgress(input.proposedTool, input.proposedTool.destination);

  // Step 5: Run Flow (Human Review & Approvals HITL Queue)
  const { flowTrace, overallStatus, primaryReason, auditRecord } = evaluateFlowReview(
    { Cut: cutTrace, Hue: hueTrace, Nova: novaTrace, Echo: echoTrace },
    input
  );

  // Calculate composite risk score for the action
  const riskInputs: { severity: SeverityLevel; confidence: number }[] = [];
  const traces = [cutTrace, hueTrace, novaTrace, echoTrace];

  for (const t of traces) {
    if (t.status === 'BLOCK') {
      riskInputs.push({ severity: 'Critical', confidence: t.confidence });
    } else if (t.status === 'REVIEW') {
      riskInputs.push({ severity: 'High', confidence: t.confidence });
    }
  }

  const riskScore = calculateRiskIndex(riskInputs);

  return {
    status: overallStatus,
    primaryReason,
    riskScore,
    agentTraces: {
      Cut: cutTrace,
      Hue: hueTrace,
      Nova: novaTrace,
      Echo: echoTrace,
      Flow: flowTrace
    },
    auditRecord,
    evaluatedAt: new Date().toISOString()
  };
}

export { updateFlowApproval, getAuditLogStore } from './flow-review';

