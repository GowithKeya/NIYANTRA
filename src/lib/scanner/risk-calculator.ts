export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  Critical: 85,
  High: 60,
  Medium: 35,
  Low: 15,
  Info: 5,
};

export interface RiskFindingInput {
  severity: SeverityLevel;
  confidence?: number; // 0.0 to 1.0, default 1.0
  title?: string;
  category?: string;
}

export const RISK_INDEX_DISCLAIMER =
  "The score prioritizes review. It is not a probability of breach. Skipped or unsupported checks remain unknown.";

/**
 * Computes Risk Index using diminishing returns formula:
 * w_i = severity_i * confidence_i
 * RiskIndex = round(100 * (1 - prod(1 - (w_i / 100)))) capped at 100
 */
export function calculateRiskIndex(findings: RiskFindingInput[]): number {
  if (!findings || findings.length === 0) {
    return 0;
  }

  let product = 1.0;

  for (const finding of findings) {
    const baseWeight = SEVERITY_WEIGHTS[finding.severity] ?? 0;
    const confidence = finding.confidence !== undefined ? Math.min(Math.max(finding.confidence, 0), 1) : 1.0;
    const wi = baseWeight * confidence;

    // Fraction factor: clamp (1 - (wi / 100)) between 0 and 1
    const factor = Math.max(0, 1 - wi / 100);
    product *= factor;
  }

  const rawScore = 100 * (1 - product);
  const rounded = Math.round(rawScore);

  return Math.min(100, Math.max(0, rounded));
}

export function getRiskLevel(score: number): {
  label: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  color: string;
  badgeClass: string;
} {
  if (score >= 80) {
    return {
      label: 'CRITICAL',
      color: '#ef4444',
      badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30'
    };
  }
  if (score >= 50) {
    return {
      label: 'HIGH',
      color: '#f97316',
      badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
    };
  }
  if (score >= 20) {
    return {
      label: 'MEDIUM',
      color: '#f59e0b',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    };
  }
  return {
    label: 'LOW',
    color: '#10b981',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  };
}

