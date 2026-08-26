import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { TicketPurchase } from '../../types';

interface ScanResultModalProps {
  scanResult: {
    success: boolean;
    message: string;
    purchase?: TicketPurchase;
  };
  onClose: () => void;
}

export default function ScanResultModal({ scanResult, onClose }: ScanResultModalProps) {
  return (
    <div
      className={`rounded-2xl p-6 border flex flex-col md:flex-row items-center gap-6 animate-scaleIn ${
        scanResult.success
          ? 'bg-emerald-500/10 border-emerald-500/20 text-white'
          : scanResult.purchase?.status === 'used'
            ? 'bg-amber-500/10 border-amber-500/20 text-white'
            : 'bg-red-500/10 border-red-500/20 text-white'
      }`}
    >
      <div className="shrink-0">
        {scanResult.success ? (
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
        ) : scanResult.purchase?.status === 'used' ? (
          <div className="h-16 w-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="h-10 w-10 animate-pulse" />
          </div>
        ) : (
          <div className="h-16 w-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <XCircle className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2">
          <span
            className={`text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
              scanResult.success
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {scanResult.success ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
          </span>
          {scanResult.purchase && (
            <span className="text-xs text-gray-400 font-mono">Ref: {scanResult.purchase.id}</span>
          )}
        </div>

        <h4 className="text-xl font-bold font-display leading-tight">{scanResult.message}</h4>

        {scanResult.purchase && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 mt-3 border-t border-white/10 text-left text-xs font-mono text-gray-300">
            <div>
              <span className="text-gray-500 text-[10px] block">MOVIE SHOW</span>
              <span className="font-bold text-white truncate block">
                {scanResult.purchase.movieTitle}
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">TICKET HOLDER</span>
              <span className="font-bold text-white truncate block">
                {scanResult.purchase.buyerName}
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">AMOUNT PAID</span>
              <span className="font-bold text-gold-light">
                GH₵{scanResult.purchase.amountPaid.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">PAYMENT REF</span>
              <span className="font-bold text-sky-light truncate block">
                {(scanResult.purchase.paystackRef || scanResult.purchase.id || 'N/A').substring(
                  0,
                  10
                )}
                ...
              </span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="rounded-lg p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
        aria-label="Dismiss result"
      >
        <XCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
