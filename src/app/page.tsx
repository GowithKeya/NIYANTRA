'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowRight, Zap, CheckCircle2, Lock, Eye, Globe, Terminal, FileCode, Users } from 'lucide-react';
import NiyantraCheckpoint3D from '@/components/canvas/NiyantraCheckpoint3D';
import FieldEvidenceTimeline from '@/components/landing/FieldEvidenceTimeline';
import ChatbotVsNiyantra from '@/components/landing/ChatbotVsNiyantra';

export default function LandingPage() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full pt-12 pb-16 px-4 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Top Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-niyantra-cyan/10 border border-niyantra-cyan/30 text-niyantra-cyan text-xs font-mono mb-6 shadow-lg shadow-cyan-500/10">
          <span className="w-2 h-2 rounded-full bg-niyantra-cyan animate-ping" />
          <span className="font-semibold uppercase tracking-wider">
            Autonomous AI Security & Action Governance Prototype
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl leading-[1.1] mb-6">
          Pre-Flight Policy Checkpoint For{' '}
          <span className="bg-gradient-to-r from-niyantra-cyan via-niyantra-violet to-niyantra-purple bg-clip-text text-transparent">
            Autonomous Agent Actions
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mb-8 leading-relaxed">
          Inspect artifacts before deployment and check proposed agent tool actions against <strong className="text-white">identity, prompt intent, data sensitivity, and destination</strong> before execution.
        </p>

        {/* Dual CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-niyantra-cyan via-niyantra-violet to-niyantra-purple text-white font-bold text-sm tracking-wide shadow-xl hover:shadow-cyan-500/25 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <span>Launch Dual-Checkpoint Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/dashboard?tab=checkpoint2"
            className="px-8 py-4 rounded-2xl bg-surface-card hover:bg-surface-hover text-gray-200 border border-surface-border font-bold text-sm tracking-wide transition flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-niyantra-amber" />
            <span>Simulate Intent Laundering</span>
          </Link>
        </div>

        {/* 3D Checkpoint Pipeline Interactive Canvas */}
        <div className="w-full mb-12">
          <div className="flex items-center justify-between mb-3 px-2 text-xs font-mono text-gray-400">
            <span>Live Interactive 3D Model: Counter-Rotating 5-Agent Orbital Gate</span>
            <span className="hidden sm:inline text-niyantra-cyan">Click any ring to inspect agent telemetry</span>
          </div>
          <NiyantraCheckpoint3D />
        </div>

        {/* Core Guarantees Banner */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>0 UPLOADED FILES EXECUTED</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Artifact review parses 21 formats via pure static text/AST memory decoding. Untrusted code is never run.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
            <div className="flex items-center gap-2 text-niyantra-cyan text-xs font-mono font-bold mb-1">
              <Eye className="w-4 h-4" />
              <span>INTENT LAUNDERING INTERCEPTION</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Catches destructive commands cloaked in benign tools (e.g. DROP TABLE inside document_search).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
            <div className="flex items-center gap-2 text-niyantra-violet text-xs font-mono font-bold mb-1">
              <Lock className="w-4 h-4" />
              <span>IMMUTABLE HITL AUDIT LEDGER</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Generates cryptographic SHA action fingerprints and four-eyes escalation queues for Flow approvals.
            </p>
          </div>
        </div>
      </section>

      {/* Field Evidence Timeline Section */}
      <div id="evidence" className="w-full border-t border-surface-border/60 bg-surface-card/20">
        <FieldEvidenceTimeline />
      </div>

      {/* Architectural Differentiation Section */}
      <div className="w-full border-t border-surface-border/60">
        <ChatbotVsNiyantra />
      </div>
    </div>
  );
}

