import { describe, it, expect } from 'vitest';
import { calculateRiskIndex, getRiskLevel } from '@/lib/scanner/risk-calculator';

describe('Risk Index Calculator & Diminishing Returns', () => {
  it('returns 0 for empty findings', () => {
    expect(calculateRiskIndex([])).toBe(0);
  });

  it('calculates single Low and Medium findings properly', () => {
    expect(calculateRiskIndex([{ severity: 'Low', confidence: 1.0 }])).toBe(15);
    expect(calculateRiskIndex([{ severity: 'Medium', confidence: 1.0 }])).toBe(35);
    expect(calculateRiskIndex([{ severity: 'Info', confidence: 1.0 }])).toBe(5);
  });

  it('scales weights by fractional confidence', () => {
    // High = 60 * 0.5 = 30 -> 100 * (1 - 0.70) = 30
    expect(calculateRiskIndex([{ severity: 'High', confidence: 0.5 }])).toBe(30);
  });

  it('caps at 100 on multiple Critical findings', () => {
    const score = calculateRiskIndex([
      { severity: 'Critical', confidence: 1.0 },
      { severity: 'Critical', confidence: 1.0 },
      { severity: 'Critical', confidence: 1.0 }
    ]);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBe(100); // 1 - (0.15)^3 = 1 - 0.003375 = 0.9966 -> rounds to 100
  });

  it('correctly maps risk levels and badge colors', () => {
    expect(getRiskLevel(85).label).toBe('CRITICAL');
    expect(getRiskLevel(65).label).toBe('HIGH');
    expect(getRiskLevel(35).label).toBe('MEDIUM');
    expect(getRiskLevel(10).label).toBe('LOW');
  });
});

