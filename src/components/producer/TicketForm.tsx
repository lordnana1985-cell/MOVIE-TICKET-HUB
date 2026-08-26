import React, { useState, FormEvent } from 'react';
import { Film, Eye } from 'lucide-react';
import { UserProfile, MovieTicket } from '../../types';
import { db, getSupabaseLastError, clearSupabaseLastError } from '../../lib/db';
import { useAssetUpload } from '../../hooks/useAssetUpload';
import TicketFormPreview from './TicketFormPreview';
import TicketMediaSection from './TicketMediaSection';
import TicketFormFields from './TicketFormFields';
import TicketFormNotice from './TicketFormNotice';

export const TEMPLATE_COVERS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600',
];

interface TicketFormProps {
  user: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TicketForm({ user, onClose, onSuccess }: TicketFormProps) {
  const [category, setCategory] = useState<'movie' | 'music' | 'beauty' | 'campus' | 'other'>(
    'movie'
  );
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const { isUploading, uploadStatus, processAndUploadAssets } = useAssetUpload();

  const handleCategoryChange = (val: 'movie' | 'music' | 'beauty' | 'campus' | 'other') => {
    setCategory(val);
    if (val === 'movie') setSelectedCover(TEMPLATE_COVERS[0]);
    else if (val === 'music') setSelectedCover(TEMPLATE_COVERS[2]);
    else if (val === 'beauty') setSelectedCover(TEMPLATE_COVERS[4]);
    else if (val === 'campus') setSelectedCover(TEMPLATE_COVERS[6]);
    else setSelectedCover(TEMPLATE_COVERS[8]);
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

    try {
      const ticketId = `tkt-${Math.random().toString(36).substring(2, 11)}`;
      const { coverUrl: finalCoverUrl, trailerUrl: formattedTrailer } =
        await processAndUploadAssets({
          userId: user.id,
          ticketId,
          coverSource,
          coverFile,
          selectedCover,
          customCover,
          videoSource,
          videoFile,
          trailerUrl,
        });

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
        category,
      };

      await db.createTicket(newTicket);
      const dbErr = getSupabaseLastError();

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
        setError(
          `Notice: Ticket created in Local Browser Storage, but failed to sync to Supabase Database (Error: "${dbErr}").`
        );
        setTimeout(() => {
          setError('');
          onSuccess();
          onClose();
        }, 6000);
      } else {
        setSuccess('Event Ticket Generated successfully!');
        setTimeout(() => {
          setSuccess('');
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to generate ticket: ${msg}`);
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
            <p className="text-xs text-gray-400">
              Launch a new event premiere, set ticket quantities, and embed media.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xs font-semibold px-2 py-1 rounded hover:bg-white/5"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400 font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-400 font-medium">
          {success}
        </div>
      )}
      {isUploading && (
        <div className="mb-4 rounded-xl bg-gold/10 border border-gold/20 p-3.5 text-xs text-gold font-medium flex items-center gap-3 animate-pulse">
          <svg className="animate-spin h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24">
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
          <span>{uploadStatus}</span>
        </div>
      )}

      <form onSubmit={handleCreateTicket} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TicketFormFields
            category={category}
            onCategoryChange={handleCategoryChange}
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            price={price}
            onPriceChange={setPrice}
            totalQuantity={totalQuantity}
            onTotalQuantityChange={setTotalQuantity}
            venue={venue}
            onVenueChange={setVenue}
            date={date}
            onDateChange={setDate}
            time={time}
            onTimeChange={setTime}
          />
          <TicketMediaSection
            trailerUrl={trailerUrl}
            setTrailerUrl={setTrailerUrl}
            videoSource={videoSource}
            setVideoSource={setVideoSource}
            videoFile={videoFile}
            setVideoFile={setVideoFile}
            coverSource={coverSource}
            setCoverSource={setCoverSource}
            selectedCover={selectedCover}
            setSelectedCover={setSelectedCover}
            customCover={customCover}
            setCustomCover={setCustomCover}
            coverFile={coverFile}
            setCoverFile={setCoverFile}
          />
        </div>

        <TicketFormNotice />

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
            {isUploading ? <span>Uploading Assets...</span> : <span>Generate Premier Ticket</span>}
          </button>
        </div>
      </form>

      <TicketFormPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={title}
        description={description}
        price={price}
        venue={venue}
        coverImageSrc={coverFile ? URL.createObjectURL(coverFile) : customCover || selectedCover}
      />
    </div>
  );
}
