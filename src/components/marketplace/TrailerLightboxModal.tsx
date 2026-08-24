import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, RotateCw, Pause, Play, LogOut } from 'lucide-react';
import { MovieTicket } from '../../types';

interface TrailerLightboxModalProps {
  ticket: MovieTicket | null;
  onClose: () => void;
}

export default function TrailerLightboxModal({ ticket, onClose }: TrailerLightboxModalProps) {
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  useEffect(() => {
    setIsVideoPlaying(true);
  }, [ticket]);

  if (!ticket) return null;

  const handleSeek = (seconds: number) => {
    if (videoElementRef.current) {
      videoElementRef.current.currentTime += seconds;
    }
  };

  const togglePlayPause = () => {
    if (videoElementRef.current) {
      if (videoElementRef.current.paused) {
        videoElementRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoElementRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const isDirectVideo =
    ticket.trailerUrl.startsWith('blob:') ||
    ticket.trailerUrl.includes('.mp4') ||
    ticket.trailerUrl.includes('.mov') ||
    ticket.trailerUrl.includes('.webm') ||
    ticket.trailerUrl.includes('/storage/v1/object/public/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-black overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full p-2 bg-black/80 text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="aspect-video bg-black relative">
          {isDirectVideo ? (
            <video
              ref={videoElementRef}
              src={ticket.trailerUrl}
              className="w-full h-full object-contain"
              controls
              autoPlay
            />
          ) : (
            <iframe
              title={`${ticket.title} Trailer`}
              src={ticket.trailerUrl}
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border-t border-white/10 p-4 font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSeek(-10)}
              className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
              title="Seek back 10 seconds"
            >
              <RotateCcw className="h-3.5 w-3.5 text-gold" />
              <span>10s Back</span>
            </button>

            <button
              type="button"
              onClick={togglePlayPause}
              className="rounded-lg bg-gold/10 hover:bg-gold/20 px-3 py-2 text-xs font-bold text-gold hover:text-white transition-all flex items-center gap-1.5 border border-gold/20 cursor-pointer"
            >
              {isVideoPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-gold" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSeek(10)}
              className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
              title="Seek forward 10 seconds"
            >
              <RotateCw className="h-3.5 w-3.5 text-gold" />
              <span>10s Forward</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-red-500/10 hover:bg-red-500/20 px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 transition-all flex items-center gap-1.5 border border-red-500/20 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 rotate-180" />
            <span>Exit Player</span>
          </button>
        </div>
      </div>
    </div>
  );
}
