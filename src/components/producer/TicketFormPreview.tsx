import React from 'react';
import { X } from 'lucide-react';

interface TicketFormPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  price: number;
  venue: string;
  coverImageSrc: string;
}

export default function TicketFormPreview({
  isOpen,
  onClose,
  title,
  description,
  price,
  venue,
  coverImageSrc,
}: TicketFormPreviewProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl glass-panel border border-gold/40 p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <h4 className="text-base font-bold text-gold font-display mb-4">Ticket Preview</h4>
        <div className="rounded-xl overflow-hidden bg-slate-900 border border-white/10">
          <img
            src={coverImageSrc}
            alt="Ticket Preview"
            className="h-48 w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="p-4 space-y-2">
            <h5 className="font-bold text-white text-lg">{title || 'Untitled Event'}</h5>
            <p className="text-xs text-gray-300 line-clamp-2">
              {description || 'No description provided.'}
            </p>
            <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
              <span className="text-gold font-bold text-sm font-mono">GH₵{price}</span>
              <span className="text-gray-400">{venue || 'Venue TBD'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
