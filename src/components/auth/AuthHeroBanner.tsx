import React from 'react';
import { Sparkles, Ticket, Shield, CheckCircle2, ArrowLeft } from 'lucide-react';

interface AuthHeroBannerProps {
  onCancel?: () => void;
}

export default function AuthHeroBanner({ onCancel }: AuthHeroBannerProps) {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-sky-950/50 to-slate-900 p-12 flex-col justify-between relative overflow-hidden border-r border-white/5">
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gold/10 blur-[100px] pointer-events-none" />

      {onCancel && (
        <div>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-400 hover:text-white transition-colors uppercase font-mono cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Marketplace
          </button>
        </div>
      )}

      <div className="space-y-6 my-auto relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 border border-gold/20 px-3 py-1 text-[10px] font-bold text-gold tracking-widest font-mono uppercase">
          <Sparkles className="h-3 w-3 text-gold animate-pulse" />
          LIVE EVENT TICKET HUB
        </div>

        <h1 className="font-display text-4xl font-extrabold tracking-tight text-white leading-tight">
          Empowering Organizers. <br />
          <span className="text-gold">Delighting Event Goers.</span>
        </h1>

        <p className="text-sm text-gray-400 leading-relaxed max-w-md">
          ETH (Event Ticket Hub) is the ultimate self-service system for movie premieres, concerts,
          pageants, campus events, and live gate ticket validation.
        </p>

        <div className="space-y-4 pt-6">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
              <Ticket className="h-3 w-3" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">
                Seamless Checkout
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Secure ticket sales backed by reliable Paystack integration.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-md bg-gold/10 border border-gold/20 text-gold shrink-0">
              <Shield className="h-3 w-3" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">
                Live Gate Validation
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Built-in scanner console for organisers to validate tickets at the event gate.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="h-3 w-3" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">
                80% Direct Organiser Payout
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Industry-leading revenue share instantly calculated and routed.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 pt-6 flex justify-between items-center text-[10px] font-mono text-gray-500">
        <span>SECURED ENCRYPTED CONNECTION</span>
        <span>v1.2.0</span>
      </div>
    </div>
  );
}
