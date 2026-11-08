'use client';

import React from 'react';
import { Shield, AlertCircle, Info } from 'lucide-react';
import { getRiskLevel, RISK_INDEX_DISCLAIMER } from '@/lib/scanner/risk-calculator';

interface RiskIndexGaugeProps {
  score: number;
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
}

export default function RiskIndexGauge({
  score,
  criticalCount = 0,
  highCount = 0,
  mediumCount = 0,
  lowCount = 0
}: RiskIndexGaugeProps) {
  const riskInfo = getRiskLevel(score);

  // Calculate SVG stroke offset for radial circle
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-niyantra-cyan" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Niyantra Risk Index
          </h4>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${riskInfo.badgeClass}`}
        >
          {riskInfo.label} RISK
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
        {/* Radial SVG Gauge */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
            {/* Background Circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="#281a4d"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Value Arc */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke={riskInfo.color}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Centered Score Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className="text-3xl font-black font-mono tracking-tight"
              style={{ color: riskInfo.color }}
            >
              {score}
            </span>
            <span className="text-[10px] font-mono text-gray-400 uppercase">/ 100 Index</span>
          </div>
        </div>

        {/* Severity Weights Diminishing Returns Breakdown */}
        <div className="space-y-2 w-full max-w-xs text-xs">
          <div className="flex items-center justify-between text-gray-400 font-mono">
            <span>Critical (85 pts):</span>
            <span className="font-bold text-red-400">{criticalCount}</span>
          </div>
          <div className="flex items-center justify-between text-gray-400 font-mono">
            <span>High (60 pts):</span>
            <span className="font-bold text-orange-400">{highCount}</span>
          </div>
          <div className="flex items-center justify-between text-gray-400 font-mono">
            <span>Medium (35 pts):</span>
            <span className="font-bold text-amber-400">{mediumCount}</span>
          </div>
          <div className="flex items-center justify-between text-gray-400 font-mono">
            <span>Low (15 pts):</span>
            <span className="font-bold text-blue-400">{lowCount}</span>
          </div>
          <div className="pt-2 border-t border-surface-border text-[11px] text-gray-400">
            Formula: <code className="text-gray-300">1 - prod(1 - w_i/100)</code>
          </div>
        </div>
      </div>

      {/* Mandatory Specification Disclaimer */}
      <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-start gap-2 text-[11px] text-gray-400 leading-normal">
        <Info className="w-3.5 h-3.5 text-niyantra-cyan shrink-0 mt-0.5" />
        <p className="italic">{RISK_INDEX_DISCLAIMER}</p>
      </div>
    </div>
  );
}

