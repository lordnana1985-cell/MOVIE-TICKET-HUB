import React from 'react';
import { Tickets } from 'lucide-react';
import { TicketPurchase } from '../../types';

interface SalesFeedProps {
  purchases: TicketPurchase[];
}

export default function SalesFeed({ purchases }: SalesFeedProps) {
  return (
    <div className="space-y-4" id="producer-sales-feed">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-gold-light flex items-center gap-2">
          <Tickets className="h-4.5 w-4.5 text-gold" />
          Admissions Feed
        </h3>
        <span className="text-[10px] text-gray-400 font-mono font-semibold">LIVE FEED</span>
      </div>

      <div className="rounded-2xl glass-panel p-4 border border-gold/10 space-y-4 max-h-[500px] overflow-y-auto">
        {purchases.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            No tickets purchased yet. Share your event premier ticket on the marketplace!
          </div>
        ) : (
          purchases.map((pur) => (
            <div
              key={pur.id}
              className="rounded-xl bg-white/5 border border-white/5 p-3 flex flex-col justify-between hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-sky-light font-mono font-bold block truncate max-w-[150px]">
                    {pur.movieTitle}
                  </span>
                  <span className="text-xs text-white font-bold block mt-0.5">{pur.buyerName}</span>
                  <span className="text-[10px] text-gray-400 block">{pur.buyerEmail}</span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-gold-light block">
                    +GH₵{pur.producerEarning.toLocaleString()}
                  </span>
                  <span className="text-[8px] text-gray-500 block font-mono">SHARE (80%)</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-gray-500">
                <span>Ref: {pur.paystackRef.substring(0, 15)}...</span>
                <span>{new Date(pur.purchasedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
