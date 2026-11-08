import { NextRequest, NextResponse } from 'next/server';
import { evaluateActionGateway, updateFlowApproval, getAuditLogStore } from '@/lib/agents/gateway';
import { ActionGatewayInput } from '@/lib/agents/types';

export async function POST(req: NextRequest) {
  try {
    const body: ActionGatewayInput = await req.json();

    if (!body.identity || !body.proposedTool || !body.originalIntent) {
      return NextResponse.json(
        { error: 'Missing required fields: identity, originalIntent, proposedTool' },
        { status: 400 }
      );
    }

    const decision = await evaluateActionGateway(body);
    return NextResponse.json(decision);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Action gateway evaluation failed.' },
      { status: 500 }
    );
  }
}

// Flow HITL queue management (Approve or Reject review items)
export async function PATCH(req: NextRequest) {
  try {
    const { auditId, action, actorName, rejectionReason } = await req.json();

    if (!auditId || !['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid parameters: auditId and action ("APPROVED" | "REJECTED") required.' },
        { status: 400 }
      );
    }

    const updated = updateFlowApproval(auditId, action, actorName || 'Security Lead', rejectionReason);
    if (!updated) {
      return NextResponse.json(
        { error: `Audit record "${auditId}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, updatedRecord: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update audit log.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const history = getAuditLogStore();
  return NextResponse.json({ auditTrail: history });
}

