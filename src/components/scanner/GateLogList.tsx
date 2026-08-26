import React from 'react';
import { History, Activity } from 'lucide-react';
import { GateLog } from '../../types';

interface GateLogListProps {
  logs: GateLog[];
}

export default function GateLogList({ logs }: GateLogListProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] text-white/40 uppercase font-bold mb-2 tracking-tighter font-mono">
          Gate Auth System
        </p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>
          <span className="text-xs font-medium text-white/80">Scanner Active: Terminal 04</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <History className="h-4.5 w-4.5 text-sky-light" />
          Gate Entrance Logs
        </h3>
        <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider flex items-center gap-1">
          <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
          SECURE LOGS
        </span>
      </div>

      <div className="rounded-2xl glass-panel p-4 border border-white/10 space-y-3 max-h-[500px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No tickets checked in at the gate yet. Enter code above to begin.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`rounded-xl bg-white/5 border p-3 flex flex-col gap-1 hover:bg-white/10 transition-colors ${
                log.status === 'success'
                  ? 'border-emerald-500/10'
                  : log.status === 'already_used'
                    ? 'border-amber-500/10'
                    : 'border-red-500/10'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-white block truncate max-w-[140px]">
                    {log.buyerName}
                  </span>
                  <span className="text-[10px] text-gray-400 block truncate max-w-[160px]">
                    {log.movieTitle}
                  </span>
                </div>

                <span
                  className={`rounded px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase ${
                    log.status === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : log.status === 'already_used'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {log.status === 'success'
                    ? 'GRANTED'
                    : log.status === 'already_used'
                      ? 'USED'
                      : 'INVALID'}
                </span>
              </div>

              <div className="mt-1 pt-1.5 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-gray-500">
                <span>Code: {log.purchaseId.substring(0, 14)}...</span>
                <span>{new Date(log.scannedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
