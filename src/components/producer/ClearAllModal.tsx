import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ClearAllModalProps {
  isOpen: boolean;
  isClearing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ClearAllModal({
  isOpen,
  isClearing,
  onCancel,
  onConfirm,
}: ClearAllModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="rounded-2xl bg-red-950/20 border border-red-500/30 p-5 space-y-4 animate-slideDown shadow-lg"
      id="producer-clear-all-modal"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white font-mono">⚠️ CLEAR ALL TICKETS PROMPT</h4>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed">
            You are about to delete <strong>all event tickets</strong> created by all registered
            organisers in the database, along with any recorded purchases and validation logs. This
            operation cannot be undone.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-red-500/15">
        <button
          type="button"
          onClick={onCancel}
          disabled={isClearing}
          className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-all disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isClearing}
          className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
        >
          {isClearing ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Clearing...</span>
            </>
          ) : (
            <span>Yes, Clear All Tickets</span>
          )}
        </button>
      </div>
    </div>
  );
}
