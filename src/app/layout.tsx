import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { ShieldCheck, Terminal, ExternalLink, Activity } from 'lucide-react';

export const metadata: Metadata = {
  title: 'NIYANTRA | AI Security Checkpoint & Action Governance',
  description: 'Pre-flight action governance & artifact review pipeline for autonomous AI agents. Allow, Block, or Review with zero untrusted code execution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-gray-100 flex flex-col selection:bg-purple-900 selection:text-white">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 w-full border-b border-surface-border/80 bg-background/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-niyantra-cyan to-niyantra-violet flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-wider text-white font-mono">
                  NIYANTRA
                </span>
                <span className="text-[10px] text-niyantra-cyan font-mono block -mt-1 tracking-widest uppercase">
                  ACTION GOVERNANCE
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-gray-300">
              <Link href="/dashboard" className="hover:text-niyantra-cyan transition">
                Dual Workspace
              </Link>
              <Link href="/dashboard?tab=checkpoint1" className="hover:text-niyantra-cyan transition">
                Artifact Review
              </Link>
              <Link href="/dashboard?tab=checkpoint2" className="hover:text-niyantra-cyan transition">
                Action Gateway
              </Link>
              <a
                href="#evidence"
                className="hover:text-niyantra-cyan transition"
              >
                Field Evidence
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-niyantra-cyan to-niyantra-violet text-white shadow-md hover:opacity-95 transition flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Open Dashboard</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-surface-border/60 py-8 px-4 bg-surface-card/40 text-xs text-gray-500 font-mono">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-niyantra-cyan" />
              <span className="text-gray-300 font-bold">NIYANTRA AI Security Checkpoint</span>
              <span>·</span>
              <span>0 Uploaded Files Executed Guarantee</span>
            </div>
            <div>
              <span>Risk Index Math: Critical=85 · High=60 · Medium=35 · Low=15 · Info=5</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

