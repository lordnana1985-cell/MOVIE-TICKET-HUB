import React from 'react';
import { Video, Search, Trash2 } from 'lucide-react';
import { MovieTicket } from '../../types';

interface AdminTicketTableProps {
  tickets: MovieTicket[];
  ticketSearch: string;
  onSearchChange: (search: string) => void;
  onSelectTicketToDelete: (ticket: MovieTicket) => void;
}

export default function AdminTicketTable({
  tickets,
  ticketSearch,
  onSearchChange,
  onSelectTicketToDelete,
}: AdminTicketTableProps) {
  return (
    <div className="glass-panel rounded-2xl border border-white/5 p-6 space-y-4" id="admin-ticket-table-container">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-rose-500" />
          <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
            MARKETPLACE TICKETS ({tickets.length})
          </h3>
        </div>
      </div>

      {/* Ticket Search */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Search movies, venues, organisers..."
          value={ticketSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl bg-black/40 border border-white/5 px-3 py-2 pl-10 text-xs text-white placeholder-gray-600 focus:border-rose-500 focus:outline-none transition-all"
        />
      </div>

      {/* Tickets list */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-mono text-xs">
            No matching tickets discovered.
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex gap-3 p-3 rounded-xl bg-black/20 hover:bg-black/40 border border-white/5 hover:border-rose-500/20 transition-all group"
            >
              <div className="w-14 h-18 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-slate-900">
                {ticket.coverUrl ? (
                  <img
                    src={ticket.coverUrl}
                    alt={ticket.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-gray-500">
                    NO ART
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white truncate group-hover:text-rose-400 transition-colors">
                    {ticket.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate">
                    By: <span className="text-gray-200">{ticket.producerName}</span>
                  </p>
                  <p className="text-[10px] text-rose-500 font-mono mt-0.5">
                    GH₵{ticket.price.toLocaleString()} • Qty: {ticket.availableQuantity}/{ticket.totalQuantity}
                  </p>
                </div>
                <span className="text-[9px] text-gray-500 font-mono uppercase truncate mt-1">
                  ID: {ticket.id}
                </span>
              </div>
              <button
                onClick={() => onSelectTicketToDelete(ticket)}
                className="self-center p-2 rounded-lg bg-rose-500/5 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                title="Delete Ticket"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
