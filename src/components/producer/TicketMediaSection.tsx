import React from 'react';
import { Film, Plus, ExternalLink } from 'lucide-react';
import { TEMPLATE_COVERS } from './TicketForm';

interface TicketMediaSectionProps {
  trailerUrl: string;
  setTrailerUrl: (url: string) => void;
  videoSource: 'url' | 'file';
  setVideoSource: (src: 'url' | 'file') => void;
  videoFile: File | null;
  setVideoFile: (file: File | null) => void;
  coverSource: 'template' | 'file';
  setCoverSource: (src: 'template' | 'file') => void;
  selectedCover: string;
  setSelectedCover: (cov: string) => void;
  customCover: string;
  setCustomCover: (cov: string) => void;
  coverFile: File | null;
  setCoverFile: (file: File | null) => void;
}

export default function TicketMediaSection({
  trailerUrl,
  setTrailerUrl,
  videoSource,
  setVideoSource,
  videoFile,
  setVideoFile,
  coverSource,
  setCoverSource,
  selectedCover,
  setSelectedCover,
  customCover,
  setCustomCover,
  coverFile,
  setCoverFile,
}: TicketMediaSectionProps) {
  return (
    <div className="space-y-4">
      {/* Video Trailer Section */}
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">
          PREVIEW TRAILER / PROMO MEDIA *
        </label>
        <div className="space-y-2">
          <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5 text-[11px] font-medium font-mono">
            <button
              type="button"
              onClick={() => setVideoSource('url')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                videoSource === 'url'
                  ? 'bg-gold/20 text-gold border border-gold/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              YOUTUBE LINK
            </button>
            <button
              type="button"
              onClick={() => setVideoSource('file')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                videoSource === 'file'
                  ? 'bg-gold/20 text-gold border border-gold/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              UPLOAD VIDEO FILE
            </button>
          </div>

          {videoSource === 'url' ? (
            <div className="relative animate-fadeIn">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <ExternalLink className="h-4 w-4" />
              </span>
              <input
                type="url"
                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={trailerUrl}
                onChange={(e) => setTrailerUrl(e.target.value)}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none"
              />
            </div>
          ) : (
            <div className="relative border-2 border-dashed border-white/15 hover:border-gold/30 rounded-xl p-3 text-center transition-all">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setVideoFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-xs text-gray-400">
                <Film className="h-5 w-5 mx-auto text-gold mb-1 opacity-80" />
                {videoFile ? (
                  <span className="text-gold font-semibold block truncate max-w-xs mx-auto">
                    ✓ {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                ) : (
                  <span>
                    Drag & drop or <strong className="text-gold">Browse video</strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cover Artwork Section */}
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">
          COVER ARTWORK DESIGN *
        </label>
        <div className="space-y-3">
          <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5 text-[11px] font-medium font-mono">
            <button
              type="button"
              onClick={() => setCoverSource('template')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                coverSource === 'template'
                  ? 'bg-gold/20 text-gold border border-gold/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              TEMPLATES / URL
            </button>
            <button
              type="button"
              onClick={() => setCoverSource('file')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                coverSource === 'file'
                  ? 'bg-gold/20 text-gold border border-gold/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              UPLOAD COVER IMAGE
            </button>
          </div>

          {coverSource === 'template' ? (
            <div className="space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar mb-1">
                {TEMPLATE_COVERS.map((cov, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedCover(cov);
                      setCustomCover('');
                    }}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      selectedCover === cov && !customCover
                        ? 'border-gold scale-105 shadow-md shadow-gold/20'
                        : 'border-white/10'
                    }`}
                  >
                    <img
                      src={cov}
                      alt={`Template ${i}`}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>

              <input
                type="url"
                placeholder="Or paste custom cover image link..."
                value={customCover}
                onChange={(e) => {
                  setCustomCover(e.target.value);
                  setSelectedCover('');
                }}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-gold focus:outline-none"
              />
            </div>
          ) : (
            <div className="relative border-2 border-dashed border-white/15 hover:border-gold/30 rounded-xl p-3 text-center transition-all animate-fadeIn">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setCoverFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-xs text-gray-400">
                <Plus className="h-5 w-5 mx-auto text-gold mb-1 opacity-80" />
                {coverFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <img
                      src={URL.createObjectURL(coverFile)}
                      alt="Preview"
                      className="h-8 w-8 object-cover rounded border border-white/10"
                    />
                    <span className="text-gold font-semibold truncate max-w-xs">
                      ✓ {coverFile.name} ({(coverFile.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                ) : (
                  <span>
                    Drag & drop or <strong className="text-gold">Browse image</strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
