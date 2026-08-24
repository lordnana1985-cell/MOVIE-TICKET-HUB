import React from 'react';
import { Play, Music, Crown, GraduationCap, Ticket, MapPin, Calendar, Clock } from 'lucide-react';
import { MovieTicket } from '../../types';

interface EventTicketCardProps {
  ticket: MovieTicket;
  onWatchTrailer: (ticket: MovieTicket) => void;
  onAddToCart: (ticket: MovieTicket) => void;
}

export default function EventTicketCard({
  ticket,
  onWatchTrailer,
  onAddToCart,
}: EventTicketCardProps) {
  const cat = ticket.category || 'movie';
  const badgeStyles =
    {
      movie: { bg: 'bg-cyan-500/90 text-white', label: 'Movie', icon: Play },
      music: { bg: 'bg-fuchsia-500/90 text-white', label: 'Music', icon: Music },
      beauty: { bg: 'bg-rose-500/90 text-white', label: 'Pageant', icon: Crown },
      campus: { bg: 'bg-emerald-500/90 text-white', label: 'Campus', icon: GraduationCap },
      other: { bg: 'bg-indigo-500/90 text-white', label: 'Event', icon: Ticket },
    }[cat] || { bg: 'bg-cyan-500/90 text-white', label: 'Movie', icon: Play };

  const IconComp = badgeStyles.icon;

  return (
    <div className="group relative rounded-3xl bg-slate-900/60 border border-white/10 hover:border-gold/40 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-gold/5">
      {/* Poster Cover */}
      <div className="relative h-56 overflow-hidden rounded-2xl bg-black/60">
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider shadow-lg ${badgeStyles.bg}`}
          >
            <IconComp className="h-2.5 w-2.5" />
            {badgeStyles.label}
          </span>
        </div>

        <img
          src={ticket.coverUrl}
          alt={ticket.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Play Trailer Floater */}
        <button
          type="button"
          onClick={() => onWatchTrailer(ticket)}
          className="absolute inset-0 flex items-center justify-center md:opacity-0 opacity-100 md:group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-[2px] cursor-pointer"
        >
          <div className="h-11 w-11 rounded-full bg-gold flex items-center justify-center shadow-lg transform scale-95 md:scale-90 md:group-hover:scale-100 transition-all">
            <Play className="h-4.5 w-4.5 text-slate-950 fill-current ml-0.5" />
          </div>
        </button>

        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
          <span className="rounded-xl bg-gold px-3 py-1.5 text-xs font-black text-slate-950 font-mono shadow-[0_0_15px_rgba(251,191,36,0.4)]">
            GH₵{ticket.price.toLocaleString()}
          </span>
          <span className="rounded-lg bg-slate-950/80 border border-white/10 px-2.5 py-1 text-[10px] text-sky-light font-mono font-bold">
            {ticket.availableQuantity} left
          </span>
        </div>
      </div>

      {/* Details Card */}
      <div className="pt-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-sky-300 block uppercase">
            PRODUCER: {ticket.producerName}
          </span>
          <h4 className="font-display font-black text-lg text-white group-hover:text-gold transition-colors mt-1 tracking-tight">
            {ticket.title}
          </h4>
          <p className="text-xs text-sky-100/60 mt-2 line-clamp-3 leading-relaxed">
            {ticket.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
          <div className="space-y-1.5 text-xs text-sky-100/70">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
              <span className="truncate font-semibold text-white/80">{ticket.venue}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-light shrink-0" />
                <span>{ticket.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-white/40 shrink-0" />
                <span>{ticket.time}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => onWatchTrailer(ticket)}
              className="rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 py-2.5 text-xs font-bold text-white transition-all cursor-pointer"
            >
              Watch Trailer
            </button>
            <button
              type="button"
              onClick={() => onAddToCart(ticket)}
              disabled={ticket.availableQuantity === 0}
              className={`rounded-xl py-2.5 text-xs font-bold tracking-wide transition-all cursor-pointer ${
                ticket.availableQuantity === 0
                  ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                  : 'bg-gold text-slate-950 hover:bg-yellow-500 border border-gold/20 font-bold shadow'
              }`}
              id={`add-to-cart-btn-${ticket.id}`}
            >
              {ticket.availableQuantity === 0 ? 'SOLD OUT' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
