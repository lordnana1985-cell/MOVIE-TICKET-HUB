import React, { useState, FormEvent } from 'react';
import { 
  Film, 
  MapPin, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Plus, 
  Eye, 
  X 
} from 'lucide-react';
import { UserProfile, MovieTicket } from '../../types';
import { db, getSupabaseLastError, clearSupabaseLastError } from '../../lib/db';

export const TEMPLATE_COVERS = [
  // Movie / Cinema
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600',
  // Music Concerts
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600',
  // Beauty Pageants
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600',
  // Campus Events
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600',
  // Others
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600'
];

interface TicketFormProps {
  user: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TicketForm({ user, onClose, onSuccess }: TicketFormProps) {
  const [category, setCategory] = useState<'movie' | 'music' | 'beauty' | 'campus' | 'other'>('movie');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(150);
  const [date, setDate] = useState('2026-08-30');
  const [time, setTime] = useState('18:00');
  const [venue, setVenue] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(150);
  const [selectedCover, setSelectedCover] = useState(TEMPLATE_COVERS[0]);
  const [customCover, setCustomCover] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSource, setVideoSource] = useState<'url' | 'file'>('url');
  const [coverSource, setCoverSource] = useState<'template' | 'file'>('template');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleCategoryChange = (val: 'movie' | 'music' | 'beauty' | 'campus' | 'other') => {
    setCategory(val);
    if (val === 'movie') {
      setSelectedCover(TEMPLATE_COVERS[0]);
    } else if (val === 'music') {
      setSelectedCover(TEMPLATE_COVERS[2]);
    } else if (val === 'beauty') {
      setSelectedCover(TEMPLATE_COVERS[4]);
    } else if (val === 'campus') {
      setSelectedCover(TEMPLATE_COVERS[6]);
    } else {
      setSelectedCover(TEMPLATE_COVERS[8]);
    }
  };

  const handleCreateTicket = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    clearSupabaseLastError();

    if (!title || !description || !venue) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Initializing asset upload...');

    try {
      const ticketId = `tkt-${Math.random().toString(36).substring(2, 11)}`;

      let finalCoverUrl = customCover.trim() || selectedCover;
      if (coverSource === 'file' && coverFile) {
        if (coverFile.size > 10 * 1024 * 1024) {
          throw new Error(`The selected cover image is too large (${(coverFile.size / (1024 * 1024)).toFixed(1)}MB). Please upload an image under 10MB.`);
        }
        setUploadStatus('Uploading cover artwork: 0%');
        const ext = coverFile.name.split('.').pop() || 'jpg';
        const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const cleanPath = `${user.id}/covers/${ticketId}/${uuid}.${ext}`;
        finalCoverUrl = await db.uploadFile('producers-assets', cleanPath, coverFile, true, (percent) => {
          setUploadStatus(`Uploading cover artwork: ${percent}%`);
        });
      }

      let formattedTrailer = trailerUrl.trim();
      if (videoSource === 'file' && videoFile) {
        if (videoFile.size > 50 * 1024 * 1024) {
          throw new Error(`The selected video trailer is too large (${(videoFile.size / (1024 * 1024)).toFixed(1)}MB). Please compress your video or use a YouTube URL instead.`);
        }
        setUploadStatus('Uploading trailer video: 0%');
        const ext = videoFile.name.split('.').pop() || 'mp4';
        const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const cleanPath = `${user.id}/videos/${ticketId}/${uuid}.${ext}`;
        formattedTrailer = await db.uploadFile('producers-assets', cleanPath, videoFile, true, (percent) => {
          setUploadStatus(`Uploading trailer video: ${percent}%`);
        });
      } else {
        if (formattedTrailer.includes('youtube.com/watch?v=')) {
          const id = formattedTrailer.split('v=')[1]?.split('&')[0];
          formattedTrailer = `https://www.youtube.com/embed/${id}`;
        } else if (formattedTrailer.includes('youtu.be/')) {
          const id = formattedTrailer.split('youtu.be/')[1]?.split('?')[0];
          formattedTrailer = `https://www.youtube.com/embed/${id}`;
        }

        if (!formattedTrailer) {
          formattedTrailer = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
        }
      }

      setUploadStatus('Generating event ticket record...');

      const newTicket: MovieTicket = {
        id: ticketId,
        title,
        description,
        price,
        date,
        time,
        venue,
        trailerUrl: formattedTrailer,
        producerId: user.id,
        producerName: user.name,
        totalQuantity,
        availableQuantity: totalQuantity,
        coverUrl: finalCoverUrl,
        createdAt: new Date().toISOString(),
        category
      };

      await db.createTicket(newTicket);
      
      const dbErr = getSupabaseLastError();
      const isFileCover = coverSource === 'file';
      const isFileVideo = videoSource === 'file';

      // Reset form
      setTitle('');
      setCategory('movie');
      setDescription('');
      setPrice(150);
      setVenue('');
      setTrailerUrl('');
      setTotalQuantity(150);
      setCustomCover('');
      setCoverFile(null);
      setVideoFile(null);
      setVideoSource('url');
      setCoverSource('template');
      
      if (dbErr) {
        setError(`Notice: Ticket created in Local Browser Storage, but failed to sync to Supabase Database (Error: "${dbErr}").`);
        setTimeout(() => {
          setError('');
          onSuccess();
          onClose();
        }, 6000);
      } else {
        let msg = 'Event Ticket Generated successfully';
        if (isFileCover || isFileVideo) {
          msg += ' and files successfully uploaded to cloud storage!';
        } else {
          msg += '!';
        }
        setSuccess(msg);
        setTimeout(() => {
          setSuccess('');
          onSuccess();
          onClose();
        }, 2000);
      }

    } catch (err: any) {
      setError(`Failed to generate ticket: ${err.message || String(err)}`);
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="rounded-2xl glass-panel border border-gold/30 gold-glow p-6 md:p-8 animate-slideDown">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Film className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">Generate Event Ticket</h3>
            <p className="text-xs text-gray-400">Launch a new event premiere, set ticket quantities, and embed media.</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xs font-semibold px-2 py-1 rounded hover:bg-white/5"
        >
          Cancel
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400 font-medium">{error}</div>}
      {success && <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-400 font-medium">{success}</div>}
      {isUploading && (
        <div className="mb-4 rounded-xl bg-gold/10 border border-gold/20 p-3.5 text-xs text-gold font-medium flex items-center gap-3 animate-pulse">
          <svg className="animate-spin h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{uploadStatus}</span>
        </div>
      )}

      <form onSubmit={handleCreateTicket} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">EVENT CATEGORY *</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as any)}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold font-medium"
              >
                <option value="movie" className="bg-slate-950">Movie Premier / Cinema</option>
                <option value="music" className="bg-slate-950">Music Show / Live Concert</option>
                <option value="beauty" className="bg-slate-950">Beauty Pageant Show</option>
                <option value="campus" className="bg-slate-950">Campus Event / Student Show</option>
                <option value="other" className="bg-slate-950">Other Shows / Live Events</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">
                {category === 'movie' ? 'MOVIE TITLE *' : 
                 category === 'music' ? 'MUSIC SHOW TITLE *' : 
                 category === 'beauty' ? 'BEAUTY PAGEANT TITLE *' : 
                 category === 'campus' ? 'CAMPUS EVENT TITLE *' : 'EVENT TITLE *'}
              </label>
              <input
                type="text"
                required
                placeholder="Enter event title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">
                {category === 'movie' ? 'PREMIERE DESCRIPTION / SYNOPSIS *' : 'EVENT DESCRIPTION *'}
              </label>
              <textarea
                required
                rows={4}
                placeholder="Provide a compelling description for attendees and ticket buyers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">TICKET PRICE (GH₵ GHS) *</label>
                <input
                  type="number"
                  required
                  min={5}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">TOTAL TICKET COUNT *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(Number(e.target.value))}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">EVENT VENUE *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silverbird Cinemas, Accra Mall, Accra"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">DATE *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 pl-10 text-sm text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">TIME *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Clock className="h-4 w-4" />
                  </span>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 pl-10 text-sm text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">TRAILER / VIDEO *</label>
              <div className="space-y-2">
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5 text-[11px] font-medium font-mono">
                  <button
                    type="button"
                    onClick={() => setVideoSource('url')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${videoSource === 'url' ? 'bg-gold/20 text-gold border border-gold/20' : 'text-gray-400 hover:text-white'}`}
                  >
                    YOUTUBE URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSource('file')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${videoSource === 'file' ? 'bg-gold/20 text-gold border border-gold/20' : 'text-gray-400 hover:text-white'}`}
                  >
                    UPLOAD VIDEO FILE
                  </button>
                </div>

                {videoSource === 'url' ? (
                  <div className="relative">
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
                        <span>Drag & drop or <strong className="text-gold">Browse video</strong></span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">COVER ARTWORK DESIGN *</label>
              <div className="space-y-3">
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5 text-[11px] font-medium font-mono">
                  <button
                    type="button"
                    onClick={() => setCoverSource('template')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${coverSource === 'template' ? 'bg-gold/20 text-gold border border-gold/20' : 'text-gray-400 hover:text-white'}`}
                  >
                    TEMPLATES / URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverSource('file')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${coverSource === 'file' ? 'bg-gold/20 text-gold border border-gold/20' : 'text-gray-400 hover:text-white'}`}
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
                          onClick={() => { setSelectedCover(cov); setCustomCover(''); }}
                          className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                            selectedCover === cov && !customCover ? 'border-gold scale-105 shadow-md shadow-gold/20' : 'border-white/10'
                          }`}
                        >
                          <img src={cov} alt={`Template ${i}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>

                    <input
                      type="url"
                      placeholder="Or paste custom cover image link..."
                      value={customCover}
                      onChange={(e) => { setCustomCover(e.target.value); setSelectedCover(''); }}
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
                          <img src={URL.createObjectURL(coverFile)} alt="Preview" className="h-8 w-8 object-cover rounded border border-white/10" />
                          <span className="text-gold font-semibold truncate max-w-xs">
                            ✓ {coverFile.name} ({(coverFile.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                      ) : (
                        <span>Drag & drop or <strong className="text-gold">Browse image</strong></span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-start gap-3">
          <div className="rounded-full bg-gold/10 p-2 border border-gold/20 text-gold text-xs shrink-0 font-bold font-mono">
            80 / 20
          </div>
          <div className="text-xs">
            <span className="font-bold text-white block">Automatic Revenue Split Enabled</span>
            Upon successful ticket purchases through Paystack, you receive <strong className="text-gold">80% of earnings</strong> directly into your account balance, while <strong className="text-sky-light">20% commission</strong> is routed back to ETH (Event Ticket Hub).
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={isUploading}
            onClick={onClose}
            className="rounded-xl px-5 py-3 text-sm font-semibold text-gray-400 hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close Panel
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="rounded-xl border border-white/10 hover:border-gold/30 hover:bg-white/5 text-gold text-sm font-semibold px-5 py-3 transition-all flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            <span>Preview Ticket</span>
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-xl bg-gradient-to-r from-gold via-gold to-gold-dark px-6 py-3 text-sm font-bold text-black hover:brightness-105 shadow-md shadow-gold/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Uploading Assets...</span>
              </>
            ) : (
              <span>Generate Premier Ticket</span>
            )}
          </button>
        </div>
      </form>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl glass-panel border border-gold/40 p-6 shadow-2xl">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-base font-bold text-gold font-display mb-4">Ticket Preview</h4>
            <div className="rounded-xl overflow-hidden bg-slate-900 border border-white/10">
              <img 
                src={coverFile ? URL.createObjectURL(coverFile) : (customCover || selectedCover)} 
                alt="Ticket Preview" 
                className="h-48 w-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="p-4 space-y-2">
                <h5 className="font-bold text-white text-lg">{title || 'Untitled Event'}</h5>
                <p className="text-xs text-gray-300 line-clamp-2">{description || 'No description provided.'}</p>
                <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
                  <span className="text-gold font-bold text-sm font-mono">GH₵{price}</span>
                  <span className="text-gray-400">{venue || 'Venue TBD'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
