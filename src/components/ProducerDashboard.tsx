import { useState, useEffect, FormEvent } from 'react';
import { 
  Plus, 
  Film, 
  DollarSign, 
  Tickets, 
  Percent, 
  Calendar, 
  Clock, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Layers,
  ArrowRight,
  Trash2,
  AlertTriangle,
  Phone,
  Database,
  Eye
} from 'lucide-react';
import { UserProfile, MovieTicket, TicketPurchase } from '../types';
import { db, getSupabaseLastError, clearSupabaseLastError } from '../lib/db';
import { EmbeddedSupportCard } from './CustomerSupport';

interface ProducerDashboardProps {
  user: UserProfile;
  onTicketCreated: () => void;
  setActiveTab: (tab: 'marketplace' | 'producer_dashboard' | 'gate_auth') => void;
}

const TEMPLATE_COVERS = [
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

export default function ProducerDashboard({
  user,
  onTicketCreated,
  setActiveTab
}: ProducerDashboardProps) {
  const [tickets, setTickets] = useState<MovieTicket[]>([]);
  const [purchases, setPurchases] = useState<TicketPurchase[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // New Ticket Form States
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

  // Paystack subaccount configuration states
  const [bankSubaccount, setBankSubaccount] = useState<string | undefined>(user.paystackSubaccountCode);
  const [bankList, setBankList] = useState<{name: string, code: string}[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isSubmittingSubaccount, setIsSubmittingSubaccount] = useState(false);
  const [subaccountError, setSubaccountError] = useState('');
  const [subaccountSuccess, setSubaccountSuccess] = useState('');
  const [isEditingSubaccount, setIsEditingSubaccount] = useState(!user.paystackSubaccountCode);

  // 4-digit code verification for editing/changing account
  const [generatedCode, setGeneratedCode] = useState('');
  const [userEnteredCode, setUserEnteredCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // Form Fields
  const [setupCountry, setSetupCountry] = useState<'GHS' | 'NGN'>('GHS');
  const [setupBusinessName, setSetupBusinessName] = useState(user.businessName || user.companyName || user.name || '');
  const [setupBankCode, setSetupBankCode] = useState('');
  const [setupAccountNumber, setSetupAccountNumber] = useState(user.accountNumber || user.phoneNumber || '');

  // Fetch Banks List when country changes
  useEffect(() => {
    const fetchBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const res = await fetch(`/api/paystack/banks?currency=${setupCountry}`);
        const result = await res.json();
        if (result.status && result.data) {
          setBankList(result.data);
          // Set default bank code if available
          if (result.data.length > 0) {
            setSetupBankCode(result.data[0].code);
          }
        }
      } catch (err) {
        console.error("Failed to load banks:", err);
      } finally {
        setIsLoadingBanks(false);
      }
    };
    fetchBanks();
  }, [setupCountry]);

  const handleCreateSubaccount = async (e: FormEvent) => {
    e.preventDefault();
    setSubaccountError('');
    setSubaccountSuccess('');
    setVerificationError('');

    // Check if they are updating an existing subaccount
    if (bankSubaccount && !showVerificationInput) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedCode(code);
      setShowVerificationInput(true);
      // Simulate sending email verification code
      console.log(`[Verification] Sent 4-digit verification code to ${user.email}: ${code}`);
      return;
    }

    if (showVerificationInput) {
      if (userEnteredCode !== generatedCode) {
        setVerificationError('Invalid 4-digit verification code. Please confirm the code sent to your email.');
        return;
      }
      // Verification succeeded, reset verification states and proceed
      setShowVerificationInput(false);
      setGeneratedCode('');
      setUserEnteredCode('');
    }

    setIsSubmittingSubaccount(true);

    try {
      const res = await fetch('/api/paystack/subaccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: setupBusinessName,
          settlement_bank: setupBankCode,
          account_number: setupAccountNumber,
          primary_contact_email: user.email
        })
      });

      const result = await res.json();

      if (result.status && result.data?.subaccount_code) {
        const code = result.data.subaccount_code;
        // Update user profile in DB
        await db.updateUserProfile(user.id, {
          paystackSubaccountCode: code,
          settlementBank: setupBankCode,
          accountNumber: setupAccountNumber,
          businessName: setupBusinessName
        });

        setBankSubaccount(code);
        setSubaccountSuccess(`Subaccount registered successfully: ${code}`);
        setIsEditingSubaccount(false);
        // Refresh parent App's user stats
        onTicketCreated();
      } else {
        setSubaccountError(result.message || 'Failed to create subaccount.');
      }
    } catch (err: any) {
      setSubaccountError(err.message || 'Network error.');
    } finally {
      setIsSubmittingSubaccount(false);
    }
  };

  // Fetch Producer Data
  const loadProducerData = async () => {
    try {
      const allTickets = await db.getTickets();
      const myTickets = allTickets.filter(t => t.producerId === user.id);
      setTickets(myTickets);

      const myPurchases = await db.getPurchasesForProducer(user.id);
      setPurchases(myPurchases);
    } catch (e) {
      console.error('Error loading producer dashboard data:', e);
    }
  };

  useEffect(() => {
    loadProducerData();

    // Auto generate Paystack subaccount if missing
    if (!user.paystackSubaccountCode) {
      const autoGenerate = async () => {
        try {
          const code = await db.generatePaystackSubaccount(user);
          if (code) {
            setBankSubaccount(code);
            setIsEditingSubaccount(false);
            onTicketCreated(); // Notify parent to reload user profile
          }
        } catch (err) {
          console.error("Auto generation of Paystack subaccount on dashboard mount failed:", err);
        }
      };
      autoGenerate();
    }
  }, [user.id, user.paystackSubaccountCode]);

  const handleDeleteTicket = async (id: string) => {
    setIsDeleting(id);
    setError('');
    setSuccess('');
    try {
      await db.deleteTicket(id);
      setSuccess('Event ticket deleted successfully!');
      setTicketToDelete(null);
      await loadProducerData();
      onTicketCreated(); // notify parent
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to delete event ticket.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearAllTickets = async () => {
    setIsClearingAll(true);
    setError('');
    setSuccess('');
    try {
      await db.clearAllTickets();
      setSuccess('All event tickets cleared successfully across all registered organisers!');
      setShowClearAllConfirm(false);
      await loadProducerData();
      onTicketCreated(); // notify parent
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to clear event tickets.');
    } finally {
      setIsClearingAll(false);
    }
  };

  // Calculations
  const totalSalesCount = purchases.length;
  const totalGrossRevenue = purchases.reduce((acc, p) => acc + p.amountPaid, 0);
  const producerShare = purchases.reduce((acc, p) => acc + p.producerEarning, 0); // 80%
  const hubShare = purchases.reduce((acc, p) => acc + p.hubEarning, 0);           // 20%

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
        if (coverFile.size > 10 * 1024 * 1024) { // 10MB limit for cover images
          throw new Error(`The selected cover image is too large (${(coverFile.size / (1024 * 1024)).toFixed(1)}MB). Please upload an image under 10MB.`);
        }
        setUploadStatus('Uploading cover artwork: 0%');
        const ext = coverFile.name.split('.').pop() || 'jpg';
        const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const cleanPath = `${user.id}/covers/${ticketId}/${uuid}.${ext}`;
        // Set allowFallback = false to ensure exact upload error is bubbled up and shown
        finalCoverUrl = await db.uploadFile('producers-assets', cleanPath, coverFile, false, (percent) => {
          setUploadStatus(`Uploading cover artwork: ${percent}%`);
        });
      }

      let formattedTrailer = trailerUrl.trim();
      if (videoSource === 'file' && videoFile) {
        if (videoFile.size > 50 * 1024 * 1024) { // 50MB limit for video uploads on Supabase free tier
          throw new Error(`The selected video trailer is too large (${(videoFile.size / (1024 * 1024)).toFixed(1)}MB). Supabase free tier storage has a strict limit of 50MB per file. Please compress your video (e.g. under 50MB) or use a YouTube URL instead.`);
        }
        setUploadStatus('Uploading trailer video: 0%');
        const ext = videoFile.name.split('.').pop() || 'mp4';
        const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const cleanPath = `${user.id}/videos/${ticketId}/${uuid}.${ext}`;
        // Set allowFallback = false to ensure exact upload error is bubbled up and shown
        formattedTrailer = await db.uploadFile('producers-assets', cleanPath, videoFile, false, (percent) => {
          setUploadStatus(`Uploading trailer video: ${percent}%`);
        });
      } else {
        // Standardize Youtube link to embed link if applicable
        if (formattedTrailer.includes('youtube.com/watch?v=')) {
          const id = formattedTrailer.split('v=')[1]?.split('&')[0];
          formattedTrailer = `https://www.youtube.com/embed/${id}`;
        } else if (formattedTrailer.includes('youtu.be/')) {
          const id = formattedTrailer.split('youtu.be/')[1]?.split('?')[0];
          formattedTrailer = `https://www.youtube.com/embed/${id}`;
        }

        if (!formattedTrailer) {
          // Default to non-stop cinematic intro placeholder
          formattedTrailer = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
        }
      }

      setUploadStatus('Generating movie premiere ticket record...');

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
        setError(`Notice: Ticket created in Local Browser Storage, but failed to sync to Supabase Database (Error: "${dbErr}"). Please ensure you have created the 'movie_tickets' database table in your Supabase dashboard.`);
        setTimeout(() => {
          setIsCreating(false);
          setError('');
          loadProducerData();
          onTicketCreated();
        }, 10000);
      } else {
        let msg = 'Movie Premier Ticket Generated successfully';
        if (isFileCover || isFileVideo) {
          msg += ' and files successfully uploaded to cloud storage!';
        } else {
          msg += '! (Note: No file uploads were triggered as you selected preset templates/URLs instead of custom local files)';
        }
        setSuccess(msg);
        setTimeout(() => {
          setIsCreating(false);
          setSuccess('');
          loadProducerData();
          onTicketCreated();
        }, 5000);
      }

    } catch (err: any) {
      setError(`Failed to generate ticket. Error: ${err.message || String(err)}. If this is a 'Bucket not found' error, please create a public storage bucket named 'producers-assets' in your Supabase dashboard.`);
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="producer-dashboard-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-mono tracking-widest text-gold font-semibold uppercase">
            {user.companyName || 'Event Production'} Organiser Portal
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white mt-1">
            Event Organiser <span className="bg-gradient-to-r from-sky-light to-sky-deep bg-clip-text text-transparent">Console</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage your event tickets, upload trailers/covers, generate tickets, and view real-time earnings.
          </p>
          {user.phoneNumber && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gold/10 border border-gold/20 px-3.5 py-2 text-xs text-gold font-mono">
              <Phone className="h-3.5 w-3.5 text-gold-light animate-pulse" />
              <span>Payout Phone: <strong className="text-white font-sans">{user.phoneNumber}</strong></span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('gate_auth')}
            className="rounded-xl glass-panel px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all border border-white/15 shadow-md flex items-center gap-2"
          >
            Gate Ticket Verifier
            <ArrowRight className="h-4 w-4 text-gold" />
          </button>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="rounded-xl bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-bold text-black hover:brightness-105 shadow-lg shadow-gold/10 transition-all flex items-center gap-2"
            id="producer-add-ticket-btn"
          >
            <Plus className="h-4 w-4 stroke-[3px]" />
            Generate Event Ticket
          </button>
        </div>
      </div>

      {/* OVERALL EARNINGS & SALES SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: GROSS SALES */}
        <div className="rounded-2xl glass-panel p-4 md:p-6 border-l-4 border-l-sky-deep shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-gray-400 font-mono tracking-wider font-medium">GROSS TICKETS REVENUE</span>
            <div className="h-8 w-8 rounded-lg bg-sky-deep/10 border border-sky-deep/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-sky-light" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl md:text-2xl font-black font-mono text-white">
              GH₵{totalGrossRevenue.toLocaleString()}
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              100% of marketplace volume
            </p>
          </div>
        </div>

        {/* CARD 2: PRODUCER SHARE (80%) */}
        <div className="rounded-2xl glass-panel p-4 md:p-6 border-l-4 border-l-gold shadow-md gold-glow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-gold-light font-mono tracking-wider font-semibold">YOUR EARNINGS (80%)</span>
            <div className="h-8 w-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Percent className="h-4 w-4 text-gold" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl md:text-2xl font-black font-mono text-gold-light">
              GH₵{producerShare.toLocaleString()}
            </h3>
            <p className="text-[10px] text-gold/60 mt-1 font-medium">
              Direct Paystack split payouts
            </p>
          </div>
        </div>

        {/* CARD 3: HUB SHARE (20%) */}
        <div className="rounded-2xl glass-panel p-4 md:p-6 border-l-4 border-l-white/20 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-gray-400 font-mono tracking-wider font-medium">HUB COMMISSION (20%)</span>
            <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl md:text-2xl font-black font-mono text-gray-300">
              GH₵{hubShare.toLocaleString()}
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">
              Sent to ETH (Event Ticket Hub) platform
            </p>
          </div>
        </div>

        {/* CARD 4: TICKETS SOLD */}
        <div className="rounded-2xl glass-panel p-4 md:p-6 border-l-4 border-l-emerald-500 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-gray-400 font-mono tracking-wider font-medium">PREMIER ADMISSIONS</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Tickets className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl md:text-2xl font-black font-mono text-white">
              {totalSalesCount} <span className="text-xs text-gray-500 font-normal">tickets</span>
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">
              Live gate validation-ready passes
            </p>
          </div>
        </div>
      </div>

      {/* CREATE TICKET MODAL / FORM COLLAPSIBLE */}
      {isCreating && (
        <div className="rounded-2xl glass-panel border border-gold/30 gold-glow p-6 md:p-8 animate-slideDown">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Film className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">Generate Movie Premier Ticket</h3>
                <p className="text-xs text-gray-400">Launch a new premiere, set ticket quantities, and embed movie trailers.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsCreating(false)}
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
              {/* LEFT FORM FIELDS */}
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
                    placeholder={
                      category === 'movie' ? 'e.g. Inception: The Awakening' : 
                      category === 'music' ? 'e.g. Afrobeat Night Live Concert' : 
                      category === 'beauty' ? 'e.g. Miss Campus Glamour 2026' : 
                      category === 'campus' ? 'e.g. University Tech Hackathon' : 'e.g. Annual Gala Extravaganza'
                    }
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
                    placeholder={
                      category === 'movie' ? 'Provide a compelling synopsis for movie goers and buyers...' : 
                      category === 'music' ? 'Describe the artist lineup, genre, age limits, and musical vibes...' : 
                      category === 'beauty' ? 'Describe the pageant segments, contestants, judging criteria, and runway details...' : 
                      category === 'campus' ? 'Provide information about the campus activities, student registration, and event schedule...' :
                      'Provide a compelling description of the show details, schedule, highlights, and why people should attend...'
                    }
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

              {/* RIGHT FORM FIELDS */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">PREMIERE CINEMA VENUE *</label>
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
                  <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">TRAILER VIDEO *</label>
                  <div className="space-y-2">
                    <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5 text-[11px] font-medium font-mono">
                      <button
                        type="button"
                        onClick={() => { setVideoSource('url'); }}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-all ${videoSource === 'url' ? 'bg-gold/20 text-gold border border-gold/20' : 'text-gray-400 hover:text-white'}`}
                      >
                        YOUTUBE URL
                      </button>
                      <button
                        type="button"
                        onClick={() => { setVideoSource('file'); }}
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
                          accept="video/*, .mp4, .mkv, .avi, .mov, .webm, .flv, .wmv, .3gp, .m4v, .mpeg, .mpg, video/mp4, video/x-matroska, video/avi, video/quicktime, video/webm, video/x-ms-wmv, video/3gpp"
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

                {/* COVER ARTWORK PICKER */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5 font-mono">PREMIERE COVER DESIGN *</label>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5 text-[11px] font-medium font-mono">
                      <button
                        type="button"
                        onClick={() => { setCoverSource('template'); }}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-all ${coverSource === 'template' ? 'bg-gold/20 text-gold border border-gold/20' : 'text-gray-400 hover:text-white'}`}
                      >
                        TEMPLATES / URL
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCoverSource('file'); }}
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
                          accept="image/*, .png, .jpg, .jpeg, .gif, .webp, .svg, .bmp, .tiff, .ico, .heic, .heif, image/png, image/jpeg, image/gif, image/webp, image/svg+xml, image/bmp, image/tiff, image/heic, image/heif"
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

            {/* SPLIT FEE NOTICE */}
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
                onClick={() => setIsCreating(false)}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-gray-400 hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close Panel
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="rounded-xl border border-white/10 hover:border-gold/30 hover:bg-white/5 text-gold text-sm font-semibold px-5 py-3 transition-all flex items-center gap-2"
                id="btn-preview-ticket-mockup"
              >
                <Eye className="h-4 w-4" />
                <span>Preview Ticket</span>
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="rounded-xl bg-gradient-to-r from-gold via-gold to-gold-dark px-6 py-3 text-sm font-bold text-black hover:brightness-105 shadow-md shadow-gold/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                id="submit-generate-ticket-btn"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
              <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-white">
                {/* Background elements */}
                <div className="absolute top-0 right-0 p-3 z-10">
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="rounded-full p-2 bg-black/40 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Left Part: Ticket Body (2/3 width) */}
                <div className="w-full md:w-2/3 h-64 md:h-80 relative overflow-hidden flex flex-col justify-end p-6 border-b md:border-b-0 md:border-r border-white/5">
                  {/* Cover background with zoom/gradient */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={
                        coverSource === 'file' && coverFile
                          ? URL.createObjectURL(coverFile)
                          : customCover.trim() || selectedCover || TEMPLATE_COVERS[0]
                      }
                      alt="Ticket Cover"
                      className="w-full h-full object-cover opacity-30 scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-900/40" />
                  </div>

                  {/* Main Ticket Info */}
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-[10px] font-bold font-mono tracking-wider text-gold uppercase">
                        ★ LIVE EVENT ENTRY TICKET
                      </span>
                      <span className="text-[10px] font-mono tracking-widest text-gray-400">
                        ADMIT ONE
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-display text-2xl font-black text-gold uppercase tracking-tight line-clamp-1">
                        {title || 'UNTITLED PREMIERE'}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                        <span className="text-gold font-bold">PRODUCER:</span> {user.companyName || user.name || 'Anonymous Producer'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10 text-xs">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase text-gray-500 tracking-wider block">DATE & TIME</span>
                        <span className="font-semibold text-white font-mono flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-gold" />
                          {date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'AUG 30, 2026'}
                        </span>
                        <span className="font-semibold text-gray-300 font-mono text-[11px] block pl-4">
                          @ {time || '18:00'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase text-gray-500 tracking-wider block">CINEMA VENUE</span>
                        <span className="font-semibold text-white font-mono flex items-center gap-1.5 truncate" title={venue || 'TBD'}>
                          <MapPin className="h-3 w-3 text-gold" />
                          {venue || 'To Be Announced'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Part: Ticket Stub (1/3 width) */}
                <div className="w-full md:w-1/3 bg-zinc-900/50 p-6 flex flex-col justify-between relative overflow-hidden">
                  {/* Notches for vertical tear effect (placed on the md:left border) */}
                  <div className="hidden md:block absolute -top-4 -left-4 h-8 w-8 rounded-full bg-black border border-white/10 z-10" />
                  <div className="hidden md:block absolute -bottom-4 -left-4 h-8 w-8 rounded-full bg-black border border-white/10 z-10" />

                  {/* Mobile horizontal notches */}
                  <div className="md:hidden absolute -left-4 -top-4 h-8 w-8 rounded-full bg-black border border-white/10 z-10" />
                  <div className="md:hidden absolute -right-4 -top-4 h-8 w-8 rounded-full bg-black border border-white/10 z-10" />

                  {/* Tear line simulation */}
                  <div className="hidden md:block absolute inset-y-0 left-0 border-l border-dashed border-white/20 h-full" />
                  <div className="md:hidden absolute inset-x-0 top-0 border-t border-dashed border-white/20 w-full" />

                  <div className="space-y-4 pt-2 md:pt-0">
                    <div className="flex justify-between items-center md:flex-col md:items-start gap-1">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">PRICE</span>
                      <span className="text-xl md:text-2xl font-black text-gold font-mono">
                        GH₵{price ? price.toLocaleString() : '150'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-gray-400 font-mono text-[10px]">
                        <span>SECTION:</span>
                        <span className="text-white font-bold">PREMIERE VIP</span>
                      </div>
                      <div className="flex justify-between text-gray-400 font-mono text-[10px]">
                        <span>GATE:</span>
                        <span className="text-white font-bold">MAIN ENTRY</span>
                      </div>
                      <div className="flex justify-between text-gray-400 font-mono text-[10px]">
                        <span>STATUS:</span>
                        <span className="text-emerald-400 font-bold">VERIFIED</span>
                      </div>
                    </div>
                  </div>

                  {/* Barcode Mockup */}
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-center items-end gap-[1.5px] h-10 bg-white/5 p-1.5 rounded border border-white/5">
                      <div className="w-[1.5px] h-full bg-white opacity-80" />
                      <div className="w-[3px] h-full bg-white opacity-80" />
                      <div className="w-[1px] h-full bg-white opacity-80" />
                      <div className="w-[2px] h-full bg-white opacity-80" />
                      <div className="w-[1px] h-full bg-white opacity-80" />
                      <div className="w-[3px] h-full bg-white opacity-80" />
                      <div className="w-[1.5px] h-full bg-white opacity-80" />
                      <div className="w-[1px] h-full bg-white opacity-80" />
                      <div className="w-[2.5px] h-full bg-white opacity-80" />
                      <div className="w-[1px] h-full bg-white opacity-80" />
                      <div className="w-[3px] h-full bg-white opacity-80" />
                      <div className="w-[1px] h-full bg-white opacity-80" />
                      <div className="w-[2px] h-full bg-white opacity-80" />
                      <div className="w-[1px] h-full bg-white opacity-80" />
                      <div className="w-[3px] h-full bg-white opacity-80" />
                      <div className="w-[1.5px] h-full bg-white opacity-80" />
                      <div className="w-[2px] h-full bg-white opacity-80" />
                      <div className="w-[1px] h-full bg-white opacity-80" />
                    </div>
                    <p className="text-[8px] font-mono tracking-[0.2em] text-center text-gray-500 uppercase">
                      *MTH-{title ? title.substring(0, 3).toUpperCase() : 'TKT'}-{Math.random().toString(36).substring(2, 6).toUpperCase()}*
                    </p>
                  </div>

                  {/* Stub Footer */}
                  <div className="text-[8px] font-mono text-center text-gray-500 mt-4 border-t border-white/5 pt-2">
                    POWERED BY EVENT TICKET HUB (ETH)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DASHBOARD BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT TWO COLS: CREATED MOVIE TICKETS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Film className="h-4.5 w-4.5 text-gold" />
              Your Generated Event Tickets
            </h3>
            <div className="flex items-center gap-3">
              {tickets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(true)}
                  className="rounded-xl border border-red-500/30 hover:border-red-500 hover:bg-red-500/10 text-red-400 hover:text-white px-3 py-1.5 text-[11px] font-bold font-mono flex items-center gap-1.5 transition-all"
                  title="Clear all generated tickets across all organisers"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>CLEAR ALL TICKETS</span>
                </button>
              )}
              <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-gray-400 font-mono">
                {tickets.length} total
              </span>
            </div>
          </div>

          {showClearAllConfirm && (
            <div className="rounded-2xl bg-red-950/20 border border-red-500/30 p-5 space-y-4 animate-slideDown shadow-lg">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-mono">⚠️ CLEAR ALL TICKETS PROMPT</h4>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    You are about to delete **all event tickets** created by all registered organisers in the database, along with any recorded purchases and validation logs. This operation cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-red-500/15">
                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(false)}
                  disabled={isClearingAll}
                  className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAllTickets}
                  disabled={isClearingAll}
                  className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isClearingAll ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Clearing...</span>
                    </>
                  ) : (
                    <span>Yes, Clear All Tickets</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {tickets.length === 0 ? (
            <div className="rounded-2xl glass-panel p-10 text-center border border-white/5">
              <Film className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">You haven't generated any movie premier tickets yet.</p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-4 rounded-xl border border-gold/30 hover:border-gold text-gold px-4 py-2 text-xs font-semibold hover:bg-gold/10 transition-all"
              >
                Generate Your First Ticket
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((tkt) => {
                const sold = purchases.filter(p => p.ticketId === tkt.id).length;
                const progress = (sold / tkt.totalQuantity) * 100;

                return (
                  <div key={tkt.id} className="relative rounded-2xl glass-panel overflow-hidden border border-white/10 flex flex-col justify-between hover:border-gold/30 transition-all group shadow-md">
                    {/* CONFIRM DELETE OVERLAY */}
                    {ticketToDelete === tkt.id && (
                      <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
                        <AlertTriangle className="h-8 w-8 text-red-500 mb-2 animate-pulse" />
                        <span className="text-white font-bold text-sm block">Delete this premiere?</span>
                        <p className="text-[10px] text-gray-400 mt-1 mb-4 leading-normal max-w-[90%]">
                          "{tkt.title}" will be permanently removed. This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setTicketToDelete(null)}
                            disabled={isDeleting === tkt.id}
                            className="rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-semibold text-gray-300 px-3 py-1.5 transition-all disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(tkt.id)}
                            disabled={isDeleting === tkt.id}
                            className="rounded-lg bg-red-600 hover:bg-red-500 text-[10px] font-bold text-white px-3 py-1.5 transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isDeleting === tkt.id ? (
                              <>
                                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
                      <img src={tkt.coverUrl} alt={tkt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

                      {/* SYNC STATUS BADGES */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                        {tkt.isLocalOnly ? (
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
                        {tkt.coverUrl?.includes('supabase') ? (
                          <span className="rounded bg-blue-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 tracking-wider uppercase shadow flex items-center gap-1 w-max">
                            Cover In Bucket
                          </span>
                        ) : tkt.coverUrl?.startsWith('blob:') || tkt.coverUrl?.startsWith('data:') ? (
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
                          setTicketToDelete(tkt.id);
                        }}
                        className="absolute top-3 right-3 z-10 rounded-lg p-1.5 bg-black/60 hover:bg-red-600 border border-white/10 text-gray-400 hover:text-white transition-all shadow"
                        title="Delete Ticket Premiere"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                        <span className="rounded bg-sky-deep/80 text-white text-[9px] font-semibold px-2 py-0.5">
                          GH₵{tkt.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-300 font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gold" />
                          {tkt.date}
                        </span>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-white text-base group-hover:text-gold-light transition-colors">{tkt.title}</h4>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tkt.description}</p>
                      </div>

                      {/* SALES PROGRESS */}
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-gray-400">Tickets Sold</span>
                          <span className="text-white font-bold">{sold} / {tkt.totalQuantity}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-sky-deep to-gold"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT ONE COL: RECENT SALES FEED */}
        <div className="space-y-6">
          {/* PAYSTACK SPLIT PAYOUT BANK SETUP CARD */}
          <div className="rounded-2xl glass-panel p-5 border border-gold/15 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="font-display text-sm font-black text-white flex items-center gap-2">
                <Percent className="h-4 w-4 text-gold" />
                80/20 Payout Subaccount
              </h4>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${bankSubaccount ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-gold/15 text-gold border border-gold/25'}`}>
                {bankSubaccount ? 'ACTIVE' : 'PENDING'}
              </span>
            </div>

            {bankSubaccount && !isEditingSubaccount ? (
              <div className="space-y-3.5 animate-fadeIn">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Automatic split is configured. When buyers purchase tickets, <strong className="text-gold">80%</strong> will go directly to your registered bank account below, and <strong className="text-sky-light">20%</strong> to the platform.
                </p>

                <div className="rounded-xl bg-white/5 border border-white/5 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subaccount Code</span>
                    <span className="font-mono font-bold text-white">{bankSubaccount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recipient Bank</span>
                    <span className="font-bold text-gray-200">
                      {bankList.find(b => b.code === user.settlementBank)?.name || user.settlementBank || 'Connected Bank'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Number</span>
                    <span className="font-mono text-gray-200">••••{user.accountNumber?.slice(-4) || '••••'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Registered Name</span>
                    <span className="font-semibold text-gray-200">{user.businessName || user.companyName || user.name}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingSubaccount(true)}
                  className="w-full rounded-xl border border-white/10 hover:border-white/25 hover:bg-white/5 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-all"
                >
                  Edit Payout Settlement Bank
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateSubaccount} className="space-y-3 animate-fadeIn">
                <p className="text-xs text-gray-400 leading-normal">
                  Configure your business bank details below to automatically receive 80% of ticket revenues directly via Paystack split-checkout.
                </p>

                {subaccountError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-[11px] text-red-400 font-medium">
                    ⚠️ {subaccountError}
                  </div>
                )}

                {subaccountSuccess && (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-400 font-medium">
                    ✓ {subaccountSuccess}
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  {/* COUNTRY SELECT */}
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">Settlement Currency & Bank Location</label>
                    <select
                      value={setupCountry}
                      onChange={(e) => setSetupCountry(e.target.value as 'GHS' | 'NGN')}
                      disabled={showVerificationInput || isLoadingBanks}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold outline-none font-medium disabled:opacity-50"
                    >
                      <option value="GHS">Ghana (GHS / GH₵)</option>
                      <option value="NGN">Nigeria (NGN / ₦)</option>
                    </select>
                  </div>

                  {/* BUSINESS NAME */}
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">Recipient / Business Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Silverbird Cinemas"
                      value={setupBusinessName}
                      onChange={(e) => setSetupBusinessName(e.target.value)}
                      disabled={showVerificationInput}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold outline-none disabled:opacity-50"
                    />
                  </div>

                  {/* SETTLEMENT BANK DROPDOWN */}
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">Select Settlement Bank</label>
                    <select
                      required
                      value={setupBankCode}
                      onChange={(e) => setSetupBankCode(e.target.value)}
                      disabled={isLoadingBanks || showVerificationInput}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold outline-none disabled:opacity-50"
                    >
                      {isLoadingBanks ? (
                        <option>Loading banks list...</option>
                      ) : bankList.length === 0 ? (
                        <option>No banks found</option>
                      ) : (
                        bankList.map(bank => (
                          <option key={bank.code} value={bank.code}>{bank.name}</option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* ACCOUNT NUMBER */}
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">Bank Account / Momo Number</label>
                    <input
                      type="text"
                      required
                      pattern="[0-9]+"
                      maxLength={20}
                      placeholder="e.g. 0244123456 or 10200456789"
                      value={setupAccountNumber}
                      onChange={(e) => setSetupAccountNumber(e.target.value.replace(/\D/g, ''))}
                      disabled={showVerificationInput}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:border-gold outline-none disabled:opacity-50"
                    />
                    {user.phoneNumber && !user.accountNumber && (
                      <p className="text-[11px] text-gold/95 mt-1 leading-normal flex items-center gap-1 font-sans font-medium">
                        ✓ Automatically prefilled with your registered phone number for payouts.
                      </p>
                    )}
                  </div>
                </div>

                {/* SECURE VERIFICATION CODE INPUT BLOCK */}
                {showVerificationInput && (
                  <div className="rounded-xl bg-gold/5 border border-gold/25 p-3.5 space-y-3 animate-fadeIn mt-3">
                    <div className="text-xs font-semibold text-gold flex items-center gap-1.5 uppercase font-mono tracking-wider">
                      <span>🔒 Secure Account Verification</span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-normal">
                      For your security, a 4-digit confirmation code has been sent to your email: <strong className="text-white">{user.email}</strong>. Please enter the code below to authorize changing your payout settlement account.
                    </p>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase text-gray-400">4-Digit Security Code</label>
                      <input
                        type="text"
                        maxLength={4}
                        required
                        placeholder="e.g. 1234"
                        value={userEnteredCode}
                        onChange={(e) => setUserEnteredCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-950 border border-gold/30 rounded-xl px-3 py-2.5 text-center font-mono text-xl tracking-widest text-gold font-bold focus:border-gold outline-none"
                      />
                      <div className="text-[10px] text-gray-500 font-mono text-center">
                        Secure verification authorization token: <strong className="text-gold select-all font-bold">{generatedCode}</strong>
                      </div>
                    </div>

                    {verificationError && (
                      <div className="text-[11px] text-red-400 font-medium text-center font-mono">
                        ⚠️ {verificationError}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  {bankSubaccount && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingSubaccount(false);
                        setShowVerificationInput(false);
                        setGeneratedCode('');
                        setUserEnteredCode('');
                        setVerificationError('');
                      }}
                      className="flex-1 rounded-xl border border-white/10 hover:bg-white/5 py-2 text-xs font-semibold text-gray-400 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmittingSubaccount || isLoadingBanks || (showVerificationInput && userEnteredCode.length < 4)}
                    className="flex-1 rounded-xl bg-gold hover:bg-yellow-500 py-2.5 text-xs font-bold text-slate-950 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(251,191,36,0.15)]"
                  >
                    {isSubmittingSubaccount ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Saving account changes...</span>
                      </>
                    ) : (
                      <span>{showVerificationInput ? "Verify & Save Changes" : "Register & Link Account"}</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-gold-light flex items-center gap-2">
                <Tickets className="h-4.5 w-4.5 text-gold" />
                Admissions Feed
              </h3>
              <span className="text-[10px] text-gray-400 font-mono font-semibold">LIVE FEED</span>
            </div>

          <div className="rounded-2xl glass-panel p-4 border border-gold/10 space-y-4 max-h-[500px] overflow-y-auto">
            {purchases.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                No tickets purchased yet. Share your movie premier ticket on the marketplace!
              </div>
            ) : (
              purchases.map((pur) => (
                <div key={pur.id} className="rounded-xl bg-white/5 border border-white/5 p-3 flex flex-col justify-between hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-sky-light font-mono font-bold block truncate max-w-[150px]">
                        {pur.movieTitle}
                      </span>
                      <span className="text-xs text-white font-bold block mt-0.5">{pur.buyerName}</span>
                      <span className="text-[10px] text-gray-400 block">{pur.buyerEmail}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-gold-light block">
                        +GH₵{pur.producerEarning.toLocaleString()}
                      </span>
                      <span className="text-[8px] text-gray-500 block font-mono">
                        SHARE (80%)
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-gray-500">
                    <span>Ref: {pur.paystackRef.substring(0, 15)}...</span>
                    <span>{new Date(pur.purchasedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* DIRECT CUSTOMER SUPPORT INFO BANNER */}
      <div className="mt-8">
        <EmbeddedSupportCard />
      </div>
    </div>
  </div>
  );
}
