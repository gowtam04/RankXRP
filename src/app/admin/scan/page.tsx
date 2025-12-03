import { Metadata } from 'next';
import ScanAdminPanel from '@/components/admin/ScanAdminPanel';

export const metadata: Metadata = {
  title: 'Scan Control | RankXRP Admin',
  robots: 'noindex, nofollow',
};

export default function ScanAdminPage() {
  return (
    <main className="min-h-screen bg-[#0a0c0e] relative overflow-hidden">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />
      </div>

      {/* Grid background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Vignette */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-ocean-abyss animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-xrp-mist/60">
              System Control
            </span>
          </div>
          <h1 className="font-mono text-3xl font-bold text-xrp-white tracking-tight">
            XRP Distribution Scanner
          </h1>
          <p className="font-mono text-sm text-xrp-mist/50 mt-2">
            Manual scan control and monitoring interface
          </p>
        </header>

        <ScanAdminPanel />
      </div>
    </main>
  );
}
