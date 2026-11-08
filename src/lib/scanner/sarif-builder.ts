import { ArtifactInspectionResult, ArtifactFinding } from './artifact-engine';
import { RISK_INDEX_DISCLAIMER } from './risk-calculator';

export function buildSarifReport(result: ArtifactInspectionResult) {
  const sarifRules = Array.from(
    new Map(
      result.findings.map((f) => [
        f.id.split('-')[0],
        {
          id: f.id.split('-')[0],
          name: f.category,
          shortDescription: { text: f.title },
          fullDescription: { text: f.description },
          help: { text: `Remediation Guidance: ${f.remediation}` },
          properties: {
            defaultSeverity: f.severity,
            precision: f.confidence >= 0.9 ? 'high' : 'medium'
          }
        }
      ])
    ).values()
  );

  const sarifResults = result.findings.map((f) => {
    let level: 'error' | 'warning' | 'note' = 'note';
    if (f.severity === 'Critical' || f.severity === 'High') {
      level = 'error';
    } else if (f.severity === 'Medium') {
      level = 'warning';
    }

    return {
      ruleId: f.id.split('-')[0],
      level,
      message: {
        text: `${f.title}: ${f.redactedEvidence}`
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: result.fileName
            },
            region: {
              startLine: f.lineNumber || 1
            }
          }
        }
      ],
      properties: {
        severity: f.severity,
        confidence: f.confidence,
        remediation: f.remediation,
        redactedEvidence: f.redactedEvidence
      }
    };
  });

  return {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'NIYANTRA Security Checkpoint',
            version: '1.0.0-prototype',
            informationUri: 'https://github.com/niyantra/security-core',
            rules: sarifRules
          }
        },
        invocations: [
          {
            executionSuccessful: true,
            endTimeUtc: result.inspectedAt,
            toolExecutionNotifications: [
              {
                message: {
                  text: `Inspected artifact "${result.fileName}" with coverage ${result.coverageStatus}. 0 uploaded files executed.`
                },
                level: 'note'
              }
            ]
          }
        ],
        artifacts: [
          {
            location: {
              uri: result.fileName
            },
            length: result.fileSizeBytes,
            sourceLanguage: result.coverageStatus
          }
        ],
        results: sarifResults,
        properties: {
          riskIndex: result.riskIndex,
          coverageStatus: result.coverageStatus,
          executedFilesCount: result.executedFilesCount,
          geminiStatus: result.geminiStatus,
          disclaimer: RISK_INDEX_DISCLAIMER
        }
      }
    ]
  };
}

export function buildMarkdownReport(result: ArtifactInspectionResult): string {
  const dateStr = new Date(result.inspectedAt).toUTCString();
  const findingsRows = result.findings.length > 0
    ? result.findings.map((f, i) =>
        `| ${i + 1} | **${f.severity}** | \`${f.category}\` | ${f.title} | Line ${f.lineNumber ?? 1} | \`${f.redactedEvidence}\` |`
      ).join('\n')
    : '| - | *Clean* | - | No security findings detected | - | - |';

  const remediationItems = result.findings.length > 0
    ? result.findings.map((f, i) =>
        `### ${i + 1}. ${f.title} [${f.severity}]\n- **Category**: \`${f.category}\`\n- **Evidence**: \`${f.redactedEvidence}\`\n- **Remediation**: ${f.remediation}\n`
      ).join('\n')
    : '_No immediate remediation actions needed._\n';

  return `# NIYANTRA SECURITY CHECKPOINT REPORT
**Artifact Target**: \`${result.fileName}\`  
**Generated UTC**: ${dateStr}  
**Guarantee**: **0 Uploaded Files Executed** (Pure AST / Text Ingestion)  

---

## Executive Risk Summary
- **Risk Index**: **${result.riskIndex} / 100**
- **Coverage Status**: \`${result.coverageStatus}\`
- **Total Findings**: **${result.findings.length}**
- **Payload Size**: \`${result.fileSizeBytes} bytes\`
- **Gemini Secondary Review**: \`${result.geminiStatus}\` ${result.geminiReason ? `(${result.geminiReason})` : ''}

> **Notice**: ${RISK_INDEX_DISCLAIMER}

---

## Detailed Findings Table
| # | Severity | Category | Title | Location | Redacted Evidence |
|---|----------|----------|-------|----------|-------------------|
${findingsRows}

---

## Prescribed Remediation Guidance
${remediationItems}

---
*Report generated deterministically by NIYANTRA Action Governance Engine v1.0.0*
`;
}

