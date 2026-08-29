import { Phone, ArrowRight, Plus } from 'lucide-react';
import { UserProfile } from '../../types';

export interface ProducerHeaderProps {
  user: UserProfile;
  isCreating: boolean;
  onToggleCreating: () => void;
  onOpenGateScanner?: () => void;
}

export default function ProducerHeader({
  user,
  isCreating,
  onToggleCreating,
  onOpenGateScanner,
}: ProducerHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <span className="text-xs font-mono tracking-widest text-gold font-semibold uppercase">
          {user.companyName || 'Event Production'} Organiser Portal
        </span>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-white mt-1">
          Event Organiser{' '}
          <span className="bg-gradient-to-r from-sky-light to-sky-deep bg-clip-text text-transparent">
            Console
          </span>
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Manage your event tickets, upload trailers/covers, generate tickets, and view real-time
          earnings.
        </p>
        {user.phoneNumber && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gold/10 border border-gold/20 px-3.5 py-2 text-xs text-gold font-mono">
            <Phone className="h-3.5 w-3.5 text-gold-light animate-pulse" />
            <span>
              Payout Phone: <strong className="text-white font-sans">{user.phoneNumber}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {onOpenGateScanner && (
          <button
            type="button"
            onClick={onOpenGateScanner}
            className="rounded-xl glass-panel px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all border border-white/15 shadow-md flex items-center gap-2 cursor-pointer"
            id="gate-verifier-nav-btn"
          >
            Gate Ticket Verifier
            <ArrowRight className="h-4 w-4 text-gold" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleCreating}
          className="rounded-xl bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-bold text-black hover:brightness-105 shadow-lg shadow-gold/10 transition-all flex items-center gap-2 cursor-pointer"
          id="producer-add-ticket-btn"
        >
          <Plus className="h-4 w-4 stroke-[3px]" />
          {isCreating ? 'Close Ticket Form' : 'Generate Event Ticket'}
        </button>
      </div>
    </div>
  );
}
