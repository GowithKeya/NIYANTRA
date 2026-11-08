'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, FileCode, Play, Activity, Layers, Lock, Sparkles, Check } from 'lucide-react';
import ArtifactScanner from '@/components/workbench/ArtifactScanner';
import ActionGatewaySim from '@/components/workbench/ActionGatewaySim';

function DashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'checkpoint2' ? 'checkpoint2' : 'checkpoint1';
  const [activeTab, setActiveTab] = useState<'checkpoint1' | 'checkpoint2'>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'checkpoint2') {
      setActiveTab('checkpoint2');
    } else if (tabParam === 'checkpoint1') {
      setActiveTab('checkpoint1');
    }
  }, [searchParams]);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-8 px-4 max-w-7xl mx-auto space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-niyantra-cyan/10 border border-niyantra-cyan/30 text-niyantra-cyan text-xs font-mono mb-2">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>OPERATIONAL ACTION GOVERNANCE CORE</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Niyantra Dual-Checkpoint Workspace
          </h2>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            Pre-deployment artifact verification & runtime tool execution governance.
          </p>
        </div>

        {/* 5-Agent Operational Status Indicator */}
        <div className="flex items-center gap-2 bg-surface-card px-4 py-2 rounded-2xl border border-surface-border text-xs font-mono">
          <span className="text-gray-400">Active Nodes:</span>
          <span className="text-niyantra-cyan font-bold">Cut</span>
          <span className="text-gray-600">·</span>
          <span className="text-blue-400 font-bold">Hue</span>
          <span className="text-gray-600">·</span>
          <span className="text-niyantra-violet font-bold">Nova</span>
          <span className="text-gray-600">·</span>
          <span className="text-pink-400 font-bold">Echo</span>
          <span className="text-gray-600">·</span>
          <span className="text-niyantra-amber font-bold">Flow</span>
        </div>
      </div>

      {/* Dual Checkpoint Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setActiveTab('checkpoint1')}
          className={`flex-1 min-w-[280px] p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${
            activeTab === 'checkpoint1'
              ? 'bg-surface-card border-niyantra-cyan ring-1 ring-niyantra-cyan shadow-xl shadow-cyan-500/10'
              : 'bg-surface-card/60 border-surface-border hover:border-surface-hover hover:bg-surface-card'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              activeTab === 'checkpoint1' ? 'bg-niyantra-cyan text-black' : 'bg-surface-hover text-gray-400'
            }`}
          >
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-niyantra-cyan">
                Checkpoint 1
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                0 Executed Files
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">Artifact Review Pipeline</h4>
            <p className="text-xs text-gray-400 mt-1">
              Upload 21 file types, 7 AST patterns, optional Gemini API, and SARIF/JSON/MD report exports.
            </p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('checkpoint2')}
          className={`flex-1 min-w-[280px] p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${
            activeTab === 'checkpoint2'
              ? 'bg-surface-card border-niyantra-violet ring-1 ring-niyantra-violet shadow-xl shadow-purple-500/10'
              : 'bg-surface-card/60 border-surface-border hover:border-surface-hover hover:bg-surface-card'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              activeTab === 'checkpoint2' ? 'bg-niyantra-violet text-white' : 'bg-surface-hover text-gray-400'
            }`}
          >
            <Play className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-niyantra-violet">
                Checkpoint 2
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300">
                Intent Laundering Gate
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">Action Gateway Simulator</h4>
            <p className="text-xs text-gray-400 mt-1">
              Test Identity, raw prompt intent, and tool arguments against Cut, Hue, Nova, Echo, and Flow.
            </p>
          </div>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'checkpoint1' && <ArtifactScanner />}
        {activeTab === 'checkpoint2' && <ActionGatewaySim />}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] flex items-center justify-center font-mono text-xs text-gray-400">
          Loading Niyantra Checkpoints...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
