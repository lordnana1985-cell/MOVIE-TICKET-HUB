import React from 'react';

export default function TicketFormNotice() {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-start gap-3">
      <div className="rounded-full bg-gold/10 p-2 border border-gold/20 text-gold text-xs shrink-0 font-bold font-mono">
        80 / 20
      </div>
      <div className="text-xs">
        <span className="font-bold text-white block">Automatic Revenue Split Enabled</span>
        Upon successful ticket purchases through Paystack, you receive{' '}
        <strong className="text-gold">80% of earnings</strong> directly into your account balance,
        while <strong className="text-sky-light">20% commission</strong> is routed back to ETH
        (Event Ticket Hub).
      </div>
    </div>
  );
}
