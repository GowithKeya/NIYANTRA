'use client';

import React, { useState } from 'react';
import { Shield, Eye, Lock, Globe, Users, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { AgentEvaluationTrace, PolicyDecisionStatus } from '@/lib/agents/types';

interface FiveAgentsTraceProps {
  traces: {
    Cut: AgentEvaluationTrace;
    Hue: AgentEvaluationTrace;
    Nova: AgentEvaluationTrace;
    Echo: AgentEvaluationTrace;
    Flow: AgentEvaluationTrace;
  };
  overallStatus?: PolicyDecisionStatus;
}

const AGENT_META = {
  Cut: {
    name: 'Cut',
    fullName: 'Cut (Access Boundaries & RBAC)',
    role: 'Identity Verification & Tool Boundaries',
    icon: Shield,
    color: '#06b6d4'
  },
  Hue: {
    name: 'Hue',
    fullName: 'Hue (Prompt & Instruction Checks)',
    role: 'Prompt Injection & Intent Laundering',
    icon: Eye,
    color: '#3b82f6'
  },
  Nova: {
    name: 'Nova',
    fullName: 'Nova (Sensitive Data & Secrets)',
    role: 'DLP Engine & Automatic Redaction',
    icon: Lock,
    color: '#a855f7'
  },
  Echo: {
    name: 'Echo',
    fullName: 'Echo (Destinations & Data Egress)',
    role: 'Destinations, Webhooks & SSRF Egress',
    icon: Globe,
    color: '#ec4899'
  },
  Flow: {
    name: 'Flow',
    fullName: 'Flow (Human Review & Approvals)',
    role: 'HITL Escalation & Immutable Audit Ledger',
    icon: Users,
    color: '#f59e0b'
  }
};

export default function FiveAgentsTrace({ traces, overallStatus }: FiveAgentsTraceProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const getStatusBadge = (status: PolicyDecisionStatus) => {
    if (status === 'ALLOW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>ALLOW</span>
        </span>
      );
    }
    if (status === 'BLOCK') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/30">
          <XCircle className="w-3.5 h-3.5" />
          <span>BLOCK</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>REVIEW</span>
      </span>
    );
  };

  const agentKeys = ['Cut', 'Hue', 'Nova', 'Echo', 'Flow'] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <span>The Five Specialist Agents Telemetry</span>
          <span className="text-xs text-gray-400 font-normal">(&lt; 4ms latency)</span>
        </h4>
        {overallStatus && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-gray-400">Composite Gateway Decision:</span>
            {getStatusBadge(overallStatus)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {agentKeys.map((key) => {
          const trace = traces[key];
          const meta = AGENT_META[key];
          const Icon = meta.icon;
          const isExpanded = expandedAgent === key;

          return (
            <div
              key={key}
              onClick={() => setExpandedAgent(isExpanded ? null : key)}
              className={`p-4 rounded-2xl bg-surface-card border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isExpanded ? 'border-white/40 ring-1 ring-white/20' : 'border-surface-border hover:border-surface-hover'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {getStatusBadge(trace.status)}
                </div>

                <h5 className="text-sm font-bold text-white font-mono mb-1">{key}</h5>
                <p className="text-[11px] text-gray-400 leading-snug mb-2">{meta.role}</p>

                <p className="text-xs text-gray-300 font-medium line-clamp-3 mb-2">
                  {trace.reason}
                </p>
              </div>

              <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span>Conf: {Math.round(trace.confidence * 100)}%</span>
                <span className="text-niyantra-cyan flex items-center gap-0.5">
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Details Tray for active agent */}
      {expandedAgent && traces[expandedAgent as keyof typeof traces] && (
        <div className="p-5 rounded-2xl bg-background/90 border border-surface-border animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: AGENT_META[expandedAgent as keyof typeof AGENT_META].color }} />
              <span>{AGENT_META[expandedAgent as keyof typeof AGENT_META].fullName} — Detailed Inspection Trace</span>
            </h5>
            <button
              onClick={() => setExpandedAgent(null)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Close ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400 font-mono block mb-1">Policy Outcome Justification:</span>
              <p className="text-gray-200 bg-surface-card p-3 rounded-xl border border-surface-border font-mono leading-relaxed">
                {traces[expandedAgent as keyof typeof traces].reason}
              </p>
            </div>

            <div>
              <span className="text-gray-400 font-mono block mb-1">Telemetry Indicators:</span>
              <div className="space-y-1.5">
                {traces[expandedAgent as keyof typeof traces].indicators.map((ind, i) => (
                  <div key={i} className="text-gray-300 bg-surface-card p-2 rounded-lg border border-surface-border font-mono">
                    • {ind}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

