'use client';

import React, { useState } from 'react';
import { Bot, ShieldCheck, XCircle, CheckCircle2, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ComparisonRow {
  dimension: string;
  chatbot: string;
  chatbotStatus: 'weak' | 'none';
  niyantra: string;
  niyantraStatus: 'strong';
  niyantraAgent?: string;
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    dimension: 'Primary Objective',
    chatbot: 'Generate text, assist conversations, summarize text ("Help me think and write").',
    chatbotStatus: 'weak',
    niyantra: 'Pre-flight action governance checkpoint ("Check what an agent may do").',
    niyantraStatus: 'strong'
  },
  {
    dimension: 'Execution Boundary',
    chatbot: 'Stateless output generation; no control over tool dispatch or side-effects.',
    chatbotStatus: 'none',
    niyantra: 'Deterministic barrier: Allow / Block / Review before any tool executes.',
    niyantraStatus: 'strong',
    niyantraAgent: 'Cut & Flow'
  },
  {
    dimension: 'Intent Laundering Defense',
    chatbot: 'Vulnerable: easily fooled if tool name sounds benign (e.g., document_search).',
    chatbotStatus: 'none',
    niyantra: 'Cross-analyzes user prompt intent against tool schemas to intercept laundered attacks.',
    niyantraStatus: 'strong',
    niyantraAgent: 'Hue'
  },
  {
    dimension: 'DLP & Credential Leakage',
    chatbot: 'Prints API keys, private keys, and passwords verbatim into chat context.',
    chatbotStatus: 'weak',
    niyantra: 'Scans 7 baseline secret patterns and auto-redacts tokens ([REDACTED]) in all outputs.',
    niyantraStatus: 'strong',
    niyantraAgent: 'Nova'
  },
  {
    dimension: 'Network Egress & SSRF',
    chatbot: 'No awareness of outbound destination or cloud metadata IPs (169.254.169.254).',
    chatbotStatus: 'none',
    niyantra: 'Validates destinations against allowlists; strictly terminates metadata and webhook tunnels.',
    niyantraStatus: 'strong',
    niyantraAgent: 'Echo'
  },
  {
    dimension: 'Artifact Safety Pipeline',
    chatbot: 'Uploads are sent to remote models without size, format, or zero-execution guarantees.',
    chatbotStatus: 'weak',
    niyantra: 'Guarantees 0 uploaded files executed. Sandboxes 21 registered extensions safely.',
    niyantraStatus: 'strong',
    niyantraAgent: 'Checkpoint 1'
  },
  {
    dimension: 'Auditability & Compliance',
    chatbot: 'Ephemeral chat history without cryptographic integrity or compliance reports.',
    chatbotStatus: 'none',
    niyantra: 'Cryptographic SHA action fingerprint, immutable audit ledger, SARIF v2.1.0 exports.',
    niyantraStatus: 'strong',
    niyantraAgent: 'Flow'
  }
];

export default function ChatbotVsNiyantra() {
  const [activeTab, setActiveTab] = useState<'all' | 'security' | 'governance'>('all');

  return (
    <section className="w-full py-16 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-niyantra-cyan/10 border border-niyantra-cyan/20 text-niyantra-cyan text-xs font-mono mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ARCHITECTURAL DIFFERENTIATION (SLIDE 04)</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
          Two Completely Different Jobs
        </h2>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
          A conversational chatbot helps humans think and write. <strong className="text-white">NIYANTRA</strong> governs what autonomous agents are permitted to execute in production environments.
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 border-b border-surface-border bg-surface-card/60 backdrop-blur-md">
          <div className="p-5 md:col-span-3 text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
            Evaluation Dimension
          </div>
          <div className="p-5 md:col-span-4 border-t md:border-t-0 md:border-l border-surface-border flex items-center gap-2 text-sm font-bold text-gray-300">
            <Bot className="w-4 h-4 text-gray-400" />
            <span>General Purpose Chatbot</span>
          </div>
          <div className="p-5 md:col-span-5 border-t md:border-t-0 md:border-l border-surface-border flex items-center gap-2 text-sm font-bold text-niyantra-cyan bg-niyantra-cyan/5">
            <ShieldCheck className="w-4 h-4 text-niyantra-cyan" />
            <span>NIYANTRA Security Checkpoint</span>
          </div>
        </div>

        <div className="divide-y divide-surface-border/60">
          {COMPARISON_DATA.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-12 group hover:bg-surface-hover/50 transition-colors"
            >
              {/* Dimension Name */}
              <div className="p-5 md:col-span-3 flex flex-col justify-center">
                <span className="text-sm font-semibold text-white">{row.dimension}</span>
                {row.niyantraAgent && (
                  <span className="text-[11px] font-mono text-niyantra-violet mt-1">
                    Enforced by {row.niyantraAgent}
                  </span>
                )}
              </div>

              {/* Chatbot Column */}
              <div className="p-5 md:col-span-4 md:border-l border-surface-border/60 flex items-start gap-3 bg-red-950/5">
                <XCircle className="w-4 h-4 text-red-400/80 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400 leading-relaxed">{row.chatbot}</p>
              </div>

              {/* Niyantra Column */}
              <div className="p-5 md:col-span-5 md:border-l border-surface-border/60 flex items-start gap-3 bg-niyantra-cyan/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-200 leading-relaxed font-medium">{row.niyantra}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive CTA to Dashboard */}
      <div className="mt-12 text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-niyantra-cyan via-niyantra-violet to-niyantra-purple text-white font-bold text-sm tracking-wide shadow-xl hover:shadow-cyan-500/20 hover:scale-[1.02] transition-all"
        >
          <span>Launch Dual-Checkpoint Governance Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

