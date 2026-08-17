import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { MovieTicket, UserProfile } from '../../types';

interface AdminModalsProps {
  ticketToDelete: MovieTicket | null;
  profileToDelete: UserProfile | null;
  actionLoading: boolean;
  onCancelTicketDelete: () => void;
  onConfirmTicketDelete: () => void;
  onCancelProfileDelete: () => void;
  onConfirmProfileDelete: () => void;
}

export default function AdminModals({
  ticketToDelete,
  profileToDelete,
  actionLoading,
  onCancelTicketDelete,
  onConfirmTicketDelete,
  onCancelProfileDelete,
  onConfirmProfileDelete,
}: AdminModalsProps) {
  return (
    <>
      {/* 1. TICKET DELETE CONFIRM MODAL */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" id="admin-ticket-delete-modal">
          <div className="w-full max-w-md rounded-2xl bg-[#090d16] border border-rose-500/20 p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-rose-500/10 p-2 text-rose-400 shrink-0">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Event Ticket?</h3>
                <p className="text-xs text-gray-400 mt-1">
                  You are about to permanently delete <strong className="text-white">"{ticketToDelete.title}"</strong>. This will remove it from the market and terminate associated sales pipelines.
                </p>
              </div>
            </div>

            <div className="bg-black/30 p-3 rounded-lg border border-white/5 space-y-1 text-xs">
              <p className="text-gray-400">
                <strong>Organiser:</strong> {ticketToDelete.producerName}
              </p>
              <p className="text-gray-400">
                <strong>Available Quantity:</strong> {ticketToDelete.availableQuantity} of {ticketToDelete.totalQuantity}
              </p>
              <p className="text-gray-400">
                <strong>Price:</strong> GH₵{ticketToDelete.price.toLocaleString()}
              </p>
            </div>

            <div className="flex justify-end gap-3 text-xs font-bold pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={onCancelTicketDelete}
                className="rounded-xl border border-white/10 hover:bg-white/5 px-4 py-2.5 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={onConfirmTicketDelete}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-4 py-2.5 text-white shadow-lg shadow-rose-950/50 flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? 'Deleting...' : 'CONFIRM & DELETE TICKET'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROFILE DELETE CONFIRM MODAL */}
      {profileToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" id="admin-profile-delete-modal">
          <div className="w-full max-w-md rounded-2xl bg-[#090d16] border border-rose-500/20 p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-600/10 p-2 text-red-500 shrink-0">
                <ShieldAlert className="h-6 w-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Permanently Remove Account?</h3>
                <p className="text-xs text-gray-400 mt-1">
                  This action is IRREVERSIBLE! You are deleting <strong className="text-white">"{profileToDelete.name}"</strong> ({profileToDelete.role}).
                </p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[11px] text-rose-350 space-y-2">
              <p className="font-semibold">⚠️ CASCADING TERMINATION ENFORCED:</p>
              <ul className="list-disc pl-4 space-y-1 text-gray-300">
                {profileToDelete.role === 'producer' ? (
                  <>
                    <li>ALL tickets published by this organiser will be wiped out from the market.</li>
                    <li>The associated Paystack subaccount links will be broken.</li>
                  </>
                ) : (
                  <>
                    <li>All purchases and transaction histories made by this buyer will be wiped out.</li>
                    <li>Their gate credentials and logs will be deleted.</li>
                  </>
                )}
                <li>They will be completely kicked out of Event Ticket Hub (ETH) database.</li>
              </ul>
            </div>

            <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-xs text-gray-400 space-y-0.5">
              <p>
                <strong>Name:</strong> {profileToDelete.name}
              </p>
              <p>
                <strong>Email:</strong> {profileToDelete.email}
              </p>
              <p>
                <strong>Role:</strong> <span className="uppercase">{profileToDelete.role}</span>
              </p>
            </div>

            <div className="flex justify-end gap-3 text-xs font-bold pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={onCancelProfileDelete}
                className="rounded-xl border border-white/10 hover:bg-white/5 px-4 py-2.5 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={onConfirmProfileDelete}
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-4 py-2.5 text-white shadow-lg shadow-red-950/40 flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? 'Terminating...' : 'CONFIRM ACCOUNT DELETION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
