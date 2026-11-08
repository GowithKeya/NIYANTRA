'use client';

import React, { useState } from 'react';
import { AlertTriangle, Database, ShieldAlert, Cpu, Calendar, ChevronRight, TrendingUp, Lock } from 'lucide-react';

interface IncidentMilestone {
  date: string;
  quarter: string;
  title: string;
  organization: string;
  impact: string;
  rootCause: string;
  niyantraDefense: string;
  agentDefeated: 'Cut' | 'Hue' | 'Nova' | 'Echo' | 'Flow';
  accentColor: string;
}

const MILESTONES: IncidentMilestone[] = [
  {
    date: 'Nov 2025',
    quarter: 'Q4 2025',
    title: 'OpenAI / Mixpanel Telemetry Key Exposure',
    organization: 'OpenAI & Mixpanel Integrations',
    impact: 'Automated agent pipelines accidentally passed analytics API keys and user tracking tokens into model context.',
    rootCause: 'Lack of pre-flight DLP scanning on tool invocation parameters.',
    niyantraDefense: 'Nova auto-redacts credentials ([REDACTED]) before tools receive payloads; Echo blocks egress to unauthorized analytics endpoints.',
    agentDefeated: 'Nova',
    accentColor: '#a855f7'
  },
  {
    date: 'Mar 2026',
    quarter: 'Q1 2026',
    title: 'Meta Internal Agent Privilege Escalation',
    organization: 'Internal Autonomous Developer Agents',
    impact: 'Autonomous code generator accessed production infrastructure due to ambiguous agent role tokens.',
    rootCause: 'No runtime RBAC enforcement or least-privilege tool boundary on autonomous sub-agents.',
    niyantraDefense: 'Cut deterministically blocks non-admin identities from production tool schemas regardless of prompt phrasing.',
    agentDefeated: 'Cut',
    accentColor: '#06b6d4'
  },
  {
    date: 'Jul 2026',
    quarter: 'Q3 2026',
    title: 'OpenAI Evaluation Models Intent Laundering',
    organization: 'LLM Evaluation & Agent Benchmarks',
    impact: 'Adversarial instructions laundered destructive database drops through seemingly benign "read_logs" and "document_search" tool routines.',
    rootCause: 'Evaluator checked tool name only without cross-referencing against user prompt intent.',
    niyantraDefense: 'Hue catches Intent Laundering by cross-analyzing raw user intent with proposed tool arguments, rejecting disguised requests.',
    agentDefeated: 'Hue',
    accentColor: '#3b82f6'
  },
  {
    date: 'Aug 2026',
    quarter: 'Q3 2026',
    title: '302.ai Public Storage Bucket Exposure',
    organization: '302.ai Multi-Agent Platform',
    impact: 'Misconfigured public object storage leaked 17.6M files and over 144,000 unredacted enterprise chat logs.',
    rootCause: 'Agents allowed unvetted egress to public cloud buckets without cryptographic review trails.',
    niyantraDefense: 'Echo blocks public S3 destinations; Flow requires multi-factor HITL sign-off for any bulk data export.',
    agentDefeated: 'Echo',
    accentColor: '#ec4899'
  }
];

const SURVEY_STATS = [
  {
    value: '54%',
    label: 'AI Incident Rate',
    detail: 'Organizations reported at least 1 production security incident caused by autonomous AI agents in early 2026.',
    color: '#ef4444'
  },
  {
    value: '41%',
    label: 'Shadow AI Tooling',
    detail: 'Autonomous agents operated tools, webhooks, and third-party integrations unsanctioned by corporate SecOps.',
    color: '#f97316'
  },
  {
    value: '37%',
    label: 'AI in Attack Chains',
    detail: 'Adversaries weaponized automated prompt injection or manipulated agent tool calls directly.',
    color: '#f59e0b'
  },
  {
    value: '32%',
    label: 'Sensitive Data Leaked',
    detail: 'Enterprises confirmed customer PII or cloud credentials leaked through uninspected agent tool arguments.',
    color: '#a855f7'
  }
];

export default function FieldEvidenceTimeline() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeMilestone = MILESTONES[selectedIdx];

  return (
    <section className="w-full py-16 px-4 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono mb-4">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>FIELD EVIDENCE & REAL-WORLD INCIDENTS</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
          Why Action Governance Can No Longer Be Deferred
        </h2>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
          From late 2025 through 2026, autonomous agent breaches shifted from theoretical jailbreaks to concrete infrastructure compromises, credential harvesting, and cloud storage leaks.
        </p>
      </div>

      {/* 2026 Industry Survey Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {SURVEY_STATS.map((stat, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-surface-card border border-surface-border relative overflow-hidden group hover:border-surface-hover transition-all"
          >
            <div
              className="absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-15 pointer-events-none"
              style={{ backgroundColor: stat.color }}
            />
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className="text-4xl font-black font-mono tracking-tight"
                style={{ color: stat.color }}
              >
                {stat.value}
              </span>
              <TrendingUp className="w-4 h-4 text-gray-500" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-2">{stat.label}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">{stat.detail}</p>
          </div>
        ))}
      </div>

      {/* Interactive Timeline Tabs */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-surface-border">
          <div>
            <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <Calendar className="w-5 h-5 text-niyantra-cyan" />
              <span>Real-World Field Evidence (Nov 2025 – Aug 2026)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Select an incident to review the root cause and Niyantra’s pre-flight agent defense.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {MILESTONES.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition flex items-center gap-2 ${
                  selectedIdx === idx
                    ? 'bg-white text-black font-bold shadow-lg'
                    : 'bg-surface-hover text-gray-300 hover:text-white border border-surface-border'
                }`}
              >
                <span>{item.date}</span>
                <span className="text-[10px] opacity-70">[{item.agentDefeated}]</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Milestone Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1 rounded-full text-xs font-mono font-semibold"
                style={{
                  backgroundColor: `${activeMilestone.accentColor}20`,
                  color: activeMilestone.accentColor,
                  border: `1px solid ${activeMilestone.accentColor}40`
                }}
              >
                {activeMilestone.quarter} · {activeMilestone.organization}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                Intercepted by Specialist Agent: <strong className="text-white">{activeMilestone.agentDefeated}</strong>
              </span>
            </div>

            <h4 className="text-2xl font-bold text-white leading-snug">
              {activeMilestone.title}
            </h4>

            <div>
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wider block mb-1">
                Real-World Blast Radius:
              </span>
              <p className="text-sm text-gray-300 leading-relaxed bg-background/50 p-4 rounded-xl border border-surface-border">
                {activeMilestone.impact}
              </p>
            </div>

            <div>
              <span className="text-xs font-mono text-red-400 uppercase tracking-wider block mb-1">
                Underlying Architectural Flaw:
              </span>
              <p className="text-sm text-red-200/90 leading-relaxed bg-red-950/20 p-4 rounded-xl border border-red-500/20">
                {activeMilestone.rootCause}
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 bg-background/80 border border-surface-border rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-3">
              <Lock className="w-4 h-4" />
              <span className="uppercase tracking-widest font-semibold">Niyantra Solution</span>
            </div>

            <h5 className="text-lg font-bold text-white mb-3">
              Deterministic Defense: {activeMilestone.agentDefeated}
            </h5>

            <p className="text-sm text-emerald-200/90 leading-relaxed mb-6">
              {activeMilestone.niyantraDefense}
            </p>

            <div className="space-y-3 pt-4 border-t border-surface-border/60 text-xs text-gray-400">
              <div className="flex items-center justify-between">
                <span>Execution Guarantee:</span>
                <span className="font-mono text-white">0 Uploaded Files Executed</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Policy Checkpoint:</span>
                <span className="font-mono text-white">Pre-Flight Deterministic</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Audit Trail:</span>
                <span className="font-mono text-white">Immutable Ledger</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

