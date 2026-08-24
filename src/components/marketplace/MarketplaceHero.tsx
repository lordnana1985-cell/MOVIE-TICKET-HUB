import React from 'react';
import { Sparkles } from 'lucide-react';

interface MarketplaceHeroProps {
  activeScreeningsCount: number;
}

export default function MarketplaceHero({ activeScreeningsCount }: MarketplaceHeroProps) {
  return (
    <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-slate-950 via-sky-950/40 to-slate-950 border border-white/10 p-6 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-sky-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-gold/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex-1 space-y-4 relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs text-gold">
          <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
          <span className="font-bold tracking-[0.2em] font-mono">PREMIERE EVENT</span>
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
          Discover Ghana's <br className="hidden md:block" />
          Most Exclusive <span className="text-gold">Movie Premieres</span>
        </h2>
        <p className="text-sm md:text-base text-sky-100/70 max-w-xl leading-relaxed">
          Secure your premium entrance tickets. Direct and authentic sales splits verified on our cinema
          ledger and fully integrated with Paystack.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs font-mono text-white/60">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Real-Time Ticket Despatch
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-white/60">
            <span className="h-2 w-2 rounded-full bg-gold" />
            Secure Paystack Split Payments
          </div>
        </div>
      </div>

      {/* LOGO HERO CARD */}
      <div className="w-full md:w-80 rounded-2xl bg-black/40 border border-white/10 p-6 backdrop-blur-xl relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-widest text-sky-300">HUB STATUS</span>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            ONLINE
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-300">
            <span>Active Screenings:</span>
            <span className="font-bold font-mono text-white">{activeScreeningsCount}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-300">
            <span>Revenue Split:</span>
            <span className="font-bold font-mono text-gold">80% / 20%</span>
          </div>
          <div className="flex justify-between text-xs text-gray-300">
            <span>Settlement:</span>
            <span className="font-bold font-mono text-sky-light">Instant Mobile Money</span>
          </div>
        </div>
      </div>
    </div>
  );
}
