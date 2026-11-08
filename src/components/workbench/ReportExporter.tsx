'use client';

import React, { useState } from 'react';
import { Download, Copy, Check, FileCode, FileText, Code2 } from 'lucide-react';
import { ArtifactInspectionResult } from '@/lib/scanner/artifact-engine';
import { buildSarifReport, buildMarkdownReport } from '@/lib/scanner/sarif-builder';

interface ReportExporterProps {
  result: ArtifactInspectionResult;
}

export default function ReportExporter({ result }: ReportExporterProps) {
  const [activeFormat, setActiveFormat] = useState<'sarif' | 'json' | 'markdown'>('sarif');
  const [copied, setCopied] = useState(false);

  const getReportContent = () => {
    if (activeFormat === 'sarif') {
      return JSON.stringify(buildSarifReport(result), null, 2);
    }
    if (activeFormat === 'markdown') {
      return buildMarkdownReport(result);
    }
    return JSON.stringify(result, null, 2);
  };

  const handleCopy = () => {
    const text = getReportContent();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = getReportContent();
    const baseName = (result.fileName || 'artifact').replace(/[^a-zA-Z0-9_-]/g, '_');
    const extension = activeFormat === 'sarif' ? 'sarif' : activeFormat === 'markdown' ? 'md' : 'json';
    const mime = activeFormat === 'markdown' ? 'text/markdown' : 'application/json';

    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `niyantra-report-${baseName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-xl space-y-4">
      {/* Header & Tab Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Download className="w-4 h-4 text-niyantra-cyan" />
            <span>Compliance & Remediation Exports</span>
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            Standardized SARIF v2.1.0 for GitHub / GitLab Code Scanning, Markdown for tickets, and JSON for SIEM ingestion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Format Tabs */}
          <div className="flex p-1 bg-background rounded-xl border border-surface-border">
            <button
              onClick={() => setActiveFormat('sarif')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 ${
                activeFormat === 'sarif'
                  ? 'bg-niyantra-purple text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>SARIF (v2.1.0)</span>
            </button>
            <button
              onClick={() => setActiveFormat('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 ${
                activeFormat === 'json'
                  ? 'bg-niyantra-purple text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => setActiveFormat('markdown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 ${
                activeFormat === 'markdown'
                  ? 'bg-niyantra-purple text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-surface-hover text-gray-300 hover:text-white border border-surface-border transition flex items-center gap-1 text-xs"
            title="Copy Report"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-niyantra-cyan/20 border border-niyantra-cyan/40 text-niyantra-cyan font-bold hover:bg-niyantra-cyan/30 transition flex items-center gap-1.5 text-xs font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .{activeFormat === 'markdown' ? 'md' : activeFormat}</span>
          </button>
        </div>
      </div>

      {/* Code / Content Viewer */}
      <div className="relative">
        <pre className="p-4 rounded-xl bg-background border border-surface-border text-[11px] font-mono text-gray-300 overflow-x-auto max-h-72 leading-relaxed selection:bg-purple-900">
          {getReportContent()}
        </pre>
      </div>
    </div>
  );
}

