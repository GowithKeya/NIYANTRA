'use client';

import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Shield, RefreshCw, Key, Sparkles, Lock, FileCode, Check } from 'lucide-react';
import { ArtifactInspectionResult } from '@/lib/scanner/artifact-engine';
import { SYNTHETIC_THREAT_SCENARIOS } from '@/lib/fixtures/synthetic-threats';
import RiskIndexGauge from './RiskIndexGauge';
import ReportExporter from './ReportExporter';

export default function ArtifactScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('agent_instructions.md');
  const [enableGemini, setEnableGemini] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ArtifactInspectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load a pre-loaded threat scenario
  const handleLoadScenario = (scenarioId: string) => {
    const sc = SYNTHETIC_THREAT_SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc || !sc.artifactPayload) return;

    setFile(null);
    setFileName(sc.artifactPayload.fileName);
    setManualText(sc.artifactPayload.content);
    setResult(null);
    setErrorMsg(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (uploaded) {
      setFile(uploaded);
      setFileName(uploaded.name);
      setResult(null);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      setFileName(dropped.name);
      setResult(null);
      setErrorMsg(null);
    }
  };

  const handleRunInspection = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let res: Response;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('enableGemini', String(enableGemini));
        formData.append('apiKey', apiKey);

        res = await fetch('/api/inspect-artifact', {
          method: 'POST',
          body: formData
        });
      } else {
        res = await fetch('/api/inspect-artifact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName,
            content: manualText,
            enableGemini,
            apiKey
          })
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Inspection pipeline failed.');
      } else {
        setResult(data);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error during artifact inspection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Guarantee */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-2 border border-emerald-500/20">
            <Check className="w-3 h-3" />
            <span>GUARANTEE: 0 UPLOADED FILES EXECUTED</span>
          </div>
          <h3 className="text-xl font-bold text-white">Checkpoint 1: Artifact Review Pipeline</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Upload artifacts (21 registered formats) to execute deterministic AST & DLP pattern checks before deployment. Inspect without running untrusted code.
          </p>
        </div>

        {/* Pre-Loaded Quick Scenarios */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-gray-400">Load Threat Sample:</span>
          <button
            onClick={() => handleLoadScenario('threat-prompt-injection-artifact')}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition"
          >
            Prompt Injection + AWS Key (.md)
          </button>
          <button
            onClick={() => {
              setFile(null);
              setFileName('database_backup.sql');
              setManualText('DROP DATABASE production_cluster; -- catastrophic purge\nTRUNCATE TABLE audit_log;');
              setResult(null);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition"
          >
            Destructive SQL (.sql)
          </button>
          <button
            onClick={() => {
              setFile(null);
              setFileName('secrets.env');
              setManualText('AWS_SECRET_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE\nDB_PASS=SuperSecretPassword123!\nAPI_TOKEN=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
              setResult(null);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition"
          >
            DLP Secrets (.env)
          </button>
        </div>
      </div>

      {/* Upload Zone & Manual Payload Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          {/* Drag & Drop File Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-surface-border bg-surface-card hover:border-niyantra-cyan/50 hover:bg-surface-hover/30'
            }`}
          >
            <input
              type="file"
              id="fileInput"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label htmlFor="fileInput" className="cursor-pointer block">
              <UploadCloud className="w-10 h-10 mx-auto mb-2 text-niyantra-cyan animate-bounce" />
              <div className="text-sm font-semibold text-white mb-1">
                {file ? `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'Drop file here or click to browse'}
              </div>
              <p className="text-xs text-gray-400">
                21 registered formats (.py, .js, .ts, .env, .sql, .sh, .json, .yaml, .dockerfile, .pdf [exp], etc.)
              </p>
            </label>
          </div>

          {/* Or Manual Editor */}
          <div className="bg-surface-card border border-surface-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-niyantra-violet" />
                <span className="text-xs font-mono text-gray-300">File Name:</span>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-background border border-surface-border text-xs font-mono text-white focus:outline-none focus:border-niyantra-cyan"
                />
              </div>
              <span className="text-[11px] text-gray-500 font-mono">AST-Safe Text Mode</span>
            </div>

            <textarea
              value={manualText}
              onChange={(e) => {
                setManualText(e.target.value);
                setFile(null);
              }}
              rows={8}
              placeholder="Paste or write file payload contents here to inspect directly..."
              className="w-full p-3 rounded-xl bg-background border border-surface-border text-xs font-mono text-gray-300 focus:outline-none focus:border-niyantra-cyan resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Configuration Column: Gemini Opt-in & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-niyantra-amber" />
              <span>Inspection Controls & Reviewer</span>
            </h4>

            {/* 7 Local Checks summary */}
            <div className="space-y-1.5 text-xs text-gray-300">
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">
                7 Deterministic Local Checks (Always On):
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-gray-400">
                <span>✓ AWS & GCP Keys</span>
                <span>✓ Private RSA/SSH Keys</span>
                <span>✓ Destructive SQL/Shell</span>
                <span>✓ Prompt Injection</span>
                <span>✓ JWT & Bearer Tokens</span>
                <span>✓ Internal IP / SSRF</span>
                <span>✓ PII SSN & Card DLP</span>
                <span>✓ Auto-Redaction Engine</span>
              </div>
            </div>

            {/* Optional Server-Side Gemini Toggle */}
            <div className="pt-3 border-t border-surface-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Server-Side Gemini Review</span>
                  <span className="text-[10px] text-gray-400 block">
                    Strict opt-in. Never sends data unless checked.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableGemini}
                    onChange={(e) => setEnableGemini(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-niyantra-cyan"></div>
                </label>
              </div>

              {enableGemini && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label className="text-[11px] font-mono text-gray-400 block">
                    Gemini API Key (Optional; fails gracefully to SKIPPED if blank):
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy... (Leave empty to test graceful fallback)"
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-background border border-surface-border text-xs font-mono text-white focus:outline-none focus:border-niyantra-cyan"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 italic">
                    Build Lesson 02: Missing key or quota limit returns explicit SKIPPED/FAILED without crashing.
                  </p>
                </div>
              )}
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunInspection}
              disabled={isLoading || (!file && !manualText.trim())}
              className={`w-full py-3.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                isLoading || (!file && !manualText.trim())
                  ? 'bg-surface-border text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-niyantra-cyan to-niyantra-violet text-white hover:opacity-95 shadow-cyan-500/20'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Inspecting Artifact AST...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Execute Checkpoint 1 Inspection</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Inspection Results Section */}
      {result && (
        <div className="space-y-6 pt-4 border-t border-surface-border animate-in fade-in duration-300">
          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-card p-4 rounded-2xl border border-surface-border">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-niyantra-cyan" />
              <div>
                <h4 className="text-sm font-bold text-white font-mono">{result.fileName}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mt-0.5">
                  <span>Coverage:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      result.coverageStatus === 'FULL'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : result.coverageStatus === 'EXPERIMENTAL'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {result.coverageStatus}
                  </span>
                  <span>·</span>
                  <span>Executed: {result.executedFilesCount} files</span>
                  <span>·</span>
                  <span>Size: {result.fileSizeBytes} bytes</span>
                </div>
              </div>
            </div>

            {/* Gemini Status Badge */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-gray-400">Gemini Cloud Review:</span>
              <span
                className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                  result.geminiStatus === 'ANALYZED'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : result.geminiStatus === 'FAILED'
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                }`}
              >
                {result.geminiStatus}
              </span>
            </div>
          </div>

          {result.geminiReason && (
            <div className="text-xs text-gray-400 font-mono bg-background/50 p-3 rounded-xl border border-surface-border">
              Gemini Notice: {result.geminiReason}
            </div>
          )}

          {/* Risk Gauge + Redacted Evidence Findings List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <RiskIndexGauge
                score={result.riskIndex}
                criticalCount={result.findings.filter((f) => f.severity === 'Critical').length}
                highCount={result.findings.filter((f) => f.severity === 'High').length}
                mediumCount={result.findings.filter((f) => f.severity === 'Medium').length}
                lowCount={result.findings.filter((f) => f.severity === 'Low').length}
              />
            </div>

            <div className="lg:col-span-7 space-y-3">
              <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center justify-between">
                <span>Security Findings & Redacted Evidence ({result.findings.length})</span>
                <span className="text-xs text-gray-400 font-normal">Auto-Redacted by Nova</span>
              </h4>

              {result.findings.length === 0 ? (
                <div className="p-8 rounded-2xl bg-surface-card border border-surface-border text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">Clean Artifact — Zero Baseline Violations</p>
                  <p className="text-xs text-gray-400 mt-1">No credentials, destructive queries, or injections found.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {result.findings.map((f, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-2 hover:border-surface-hover transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              f.severity === 'Critical'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : f.severity === 'High'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}
                          >
                            {f.severity}
                          </span>
                          <span>{f.title}</span>
                        </span>
                        <span className="text-[11px] font-mono text-gray-400">Line {f.lineNumber ?? 1}</span>
                      </div>

                      <div className="bg-background/80 p-2.5 rounded-lg border border-surface-border font-mono text-xs text-red-300">
                        <code>{f.redactedEvidence}</code>
                      </div>

                      <p className="text-xs text-gray-400 leading-relaxed">{f.remediation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Report Exporter Component */}
          <ReportExporter result={result} />
        </div>
      )}
    </div>
  );
}

