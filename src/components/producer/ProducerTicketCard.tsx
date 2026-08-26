import React from 'react';
import { Clock, AlertTriangle, Database, Trash2 } from 'lucide-react';
import { MovieTicket } from '../../types';

interface ProducerTicketCardProps {
  key?: React.Key;
  ticket: MovieTicket;
  soldCount: number;
  isConfirmingDelete: boolean;
  isDeleting: boolean;
  onPromptDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void | Promise<void>;
}

export default function ProducerTicketCard({
  ticket,
  soldCount,
  isConfirmingDelete,
  isDeleting,
  onPromptDelete,
  onCancelDelete,
  onConfirmDelete,
}: ProducerTicketCardProps) {
  const progress = ticket.totalQuantity > 0 ? (soldCount / ticket.totalQuantity) * 100 : 0;

  return (
    <div
      className="relative rounded-2xl glass-panel overflow-hidden border border-white/10 flex flex-col justify-between hover:border-gold/30 transition-all group shadow-md"
      id={`producer-ticket-${ticket.id}`}
    >
      {/* CONFIRM DELETE OVERLAY */}
      {isConfirmingDelete && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
          <AlertTriangle className="h-8 w-8 text-red-500 mb-2 animate-pulse" />
          <span className="text-white font-bold text-sm block">Delete this premiere?</span>
          <p className="text-[10px] text-gray-400 mt-1 mb-4 leading-normal max-w-[90%]">
            "{ticket.title}" will be permanently removed. This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancelDelete}
              disabled={isDeleting}
              className="rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-semibold text-gray-300 px-3 py-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirmDelete(ticket.id)}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 hover:bg-red-500 text-[10px] font-bold text-white px-3 py-1.5 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Yes, Delete</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TOP HERO */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={ticket.coverUrl}
          alt={ticket.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

        {/* SYNC STATUS BADGES */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {ticket.isLocalOnly ? (
            <span className="rounded bg-amber-500/90 text-black text-[8px] font-bold px-1.5 py-0.5 tracking-wider uppercase shadow flex items-center gap-1 w-max">
              <AlertTriangle className="h-2.5 w-2.5" />
              Local Only
            </span>
          ) : (
            <span className="rounded bg-emerald-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 tracking-wider uppercase shadow flex items-center gap-1 w-max">
              <Database className="h-2.5 w-2.5" />
              Supabase DB
            </span>
          )}
          {ticket.coverUrl?.includes('supabase') ? (
            <span className="rounded bg-blue-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 tracking-wider uppercase shadow flex items-center gap-1 w-max">
              Cover In Bucket
            </span>
          ) : ticket.coverUrl?.startsWith('blob:') || ticket.coverUrl?.startsWith('data:') ? (
            <span className="rounded bg-rose-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 tracking-wider uppercase shadow flex items-center gap-1 w-max">
              Cover Unsaved
            </span>
          ) : (
            <span className="rounded bg-gray-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 tracking-wider uppercase shadow flex items-center gap-1 w-max">
              Preset Template
            </span>
          )}
        </div>

        {/* DELETE ICON BUTTON */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPromptDelete(ticket.id);
          }}
          className="absolute top-3 right-3 z-10 rounded-lg p-1.5 bg-black/60 hover:bg-red-600 border border-white/10 text-gray-400 hover:text-white transition-all shadow cursor-pointer"
          title="Delete Ticket Premiere"
          aria-label={`Delete ${ticket.title}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <span className="rounded bg-sky-deep/80 text-white text-[9px] font-semibold px-2 py-0.5">
            GH₵{ticket.price.toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-300 font-mono flex items-center gap-1">
            <Clock className="h-3 w-3 text-gold" />
            {ticket.date}
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-white text-base group-hover:text-gold-light transition-colors">
            {ticket.title}
          </h4>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ticket.description}</p>
        </div>

        {/* SALES PROGRESS */}
        <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-gray-400">Tickets Sold</span>
            <span className="text-white font-bold">
              {soldCount} / {ticket.totalQuantity}
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-deep to-gold"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
