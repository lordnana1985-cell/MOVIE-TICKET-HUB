import { Search, Film, User } from 'lucide-react';
import { TicketPurchase } from '../../types';

export interface QuickPassSimulatorProps {
  purchasableTickets: TicketPurchase[];
  onQuickScan: (purchase: TicketPurchase) => void;
}

export default function QuickPassSimulator({
  purchasableTickets,
  onQuickScan,
}: QuickPassSimulatorProps) {
  return (
    <div className="pt-4 border-t border-white/10 space-y-3" data-testid="quick-pass-simulator">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5 text-gold" />
          Quick Pass Simulator (Active Database)
        </span>
        <span className="text-[10px] text-gray-500 font-mono">
          {purchasableTickets.length} Passes On File
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
        {purchasableTickets.slice(0, 6).map((purchase) => (
          <button
            key={purchase.id}
            type="button"
            onClick={() => onQuickScan(purchase)}
            className="group rounded-xl bg-white/5 border border-white/10 p-2.5 text-left hover:border-gold/50 transition-all flex items-center justify-between"
            data-testid={`quick-pass-btn-${purchase.id}`}
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 text-xs text-white font-medium truncate">
                <Film className="h-3 w-3 text-gold shrink-0" />
                <span className="truncate">{purchase.movieTitle}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono mt-0.5">
                <User className="h-2.5 w-2.5" />
                <span className="truncate">{purchase.buyerName}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500 font-bold">{purchase.id.substring(0, 10)}...</span>
              </div>
            </div>
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${
                purchase.status === 'unused'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {purchase.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
