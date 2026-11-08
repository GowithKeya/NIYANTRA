import { describe, it, expect } from 'vitest';
import { evaluateActionGateway, updateFlowApproval } from '@/lib/agents/gateway';
import { inspectArtifact } from '@/lib/scanner/artifact-engine';
import { buildSarifReport, buildMarkdownReport } from '@/lib/scanner/sarif-builder';
import { SYNTHETIC_THREAT_SCENARIOS } from '@/lib/fixtures/synthetic-threats';

describe('NIYANTRA End-to-End Governance Workflow', () => {
  it('executes full artifact inspection pipeline and exports valid SARIF & Markdown', async () => {
    const scenario = SYNTHETIC_THREAT_SCENARIOS.find((s) => s.id === 'threat-prompt-injection-artifact');
    expect(scenario).toBeDefined();

    const inspection = await inspectArtifact({
      name: scenario!.artifactPayload!.fileName,
      text: scenario!.artifactPayload!.content
    }, { enableGemini: false });

    // Guarantee: 0 uploaded files executed
    expect(inspection.executedFilesCount).toBe(0);
    expect(inspection.riskIndex).toBeGreaterThan(70);
    expect(inspection.findings.length).toBeGreaterThan(0);

    // Verify auto-redaction of secrets in clean text
    expect(inspection.cleanTextRedacted).toContain('GCP_API_KEY=AIza[REDACTED_GCP_KEY]');
    expect(inspection.cleanTextRedacted).not.toContain('sample_test_key_pattern35x');

    // Generate SARIF
    const sarif = buildSarifReport(inspection);
    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs[0].results.length).toBe(inspection.findings.length);

    // Generate Markdown
    const md = buildMarkdownReport(inspection);
    expect(md).toContain('# NIYANTRA SECURITY CHECKPOINT REPORT');
    expect(md).toContain('0 Uploaded Files Executed');
  });

  it('runs multi-agent action gateway, triggers Flow review, and approves audit record', async () => {
    // Engineer performing a high-impact non-prod action triggering review
    const decision = await evaluateActionGateway({
      identity: { userId: 'usr_eng_test', role: 'engineer' },
      originalIntent: 'Purge test table from staging database',
      proposedTool: {
        name: 'database_maintenance',
        arguments: { action: 'TRUNCATE TABLE test_records;' },
        destination: 'internal://staging-cluster'
      }
    });

    expect(decision.status).toBe('REVIEW');
    expect(decision.auditRecord.flowApprovalStatus).toBe('PENDING');

    // Simulate Human Reviewer approving the action
    const updated = updateFlowApproval(
      decision.auditRecord.id,
      'APPROVED',
      'Principal Security Architect'
    );

    expect(updated).not.toBeNull();
    expect(updated?.flowApprovalStatus).toBe('APPROVED');
    expect(updated?.approvedBy).toBe('Principal Security Architect');
  });
});

