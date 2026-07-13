import { useState, useEffect, FormEvent, useRef } from 'react';
import { 
  Search, 
  Play, 
  MapPin, 
  Calendar, 
  Clock, 
  Tag, 
  CheckCircle2, 
  X, 
  CreditCard, 
  ArrowRight,
  ShieldAlert,
  Info,
  Sparkles,
  Ticket,
  ChevronRight,
  User,
  ExternalLink,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Pause,
  LogOut,
  Eye,
  EyeOff,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Music,
  Crown,
  GraduationCap
} from 'lucide-react';
import { UserProfile, MovieTicket, TicketPurchase } from '../types';

export interface CartItem {
  ticket: MovieTicket;
  quantity: number;
}
import { db } from '../lib/db';

interface MarketplaceProps {
  user: UserProfile | null;
  tickets: MovieTicket[];
  purchases: TicketPurchase[];
  onPurchaseComplete: () => void;
  onOpenAuth: (role: 'producer' | 'buyer') => void;
}

export default function Marketplace({
  user,
  tickets,
  purchases,
  onPurchaseComplete,
  onOpenAuth
}: MarketplaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState<number>(2000);
  const [selectedMovie, setSelectedMovie] = useState<MovieTicket | null>(null);
  const [selectedTrailer, setSelectedTrailer] = useState<MovieTicket | null>(null);

  // Paystack Overlay State
  const [paystackCheckout, setPaystackCheckout] = useState<boolean>(false);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [pendingPaystackRef, setPendingPaystackRef] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [showCVV, setShowCVV] = useState(false);
  const [paystackSuccess, setPaystackSuccess] = useState(false);
  const [paystackStep, setPaystackStep] = useState<'details' | 'otp' | 'success'>('details');
  const [otpCode, setOtpCode] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const handleClosePaystackCheckout = () => {
    setPaystackCheckout(false);
    setPaystackStep('details');
    setPendingPaystackRef(null);
    setPaymentError('');
    setIsInitializingPayment(false);
  };

  // Buyer Passes State
  const [myPasses, setMyPasses] = useState<TicketPurchase[]>([]);

  // Shopping Cart States
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('movie_ticket_hub_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('movie_ticket_hub_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (ticket: MovieTicket) => {
    if (!user) {
      onOpenAuth('buyer');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.ticket.id === ticket.id);
      if (existing) {
        // Guard against exceeding available quantity
        const newQty = Math.min(existing.quantity + 1, ticket.availableQuantity);
        return prev.map(item => 
          item.ticket.id === ticket.id 
            ? { ...item, quantity: newQty } 
            : item
        );
      } else {
        return [...prev, { ticket, quantity: 1 }];
      }
    });
    
    // Open cart drawer to give direct feedback and let them see their selected items
    setIsCartOpen(true);
  };

  const removeFromCart = (ticketId: string) => {
    setCart(prev => prev.filter(item => item.ticket.id !== ticketId));
  };

  const updateQuantity = (ticketId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.ticket.id === ticketId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          // Guard against exceeding available quantity
          const maxQty = item.ticket.availableQuantity;
          return { ...item, quantity: Math.min(newQty, maxQty) };
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.ticket.price * item.quantity), 0);
  const totalItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Video Player Ref & Helper States
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

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

  useEffect(() => {
    if (!selectedTrailer) {
      setIsVideoPlaying(true);
    }
  }, [selectedTrailer]);

  const loadMyPasses = async () => {
    if (!user) return;
    try {
      const myTickets = await db.getPurchasesForBuyer(user.id);
      setMyPasses(myTickets);
    } catch (e) {
      console.error('Failed to load my purchased passes:', e);
    }
  };

  useEffect(() => {
    loadMyPasses();
  }, [user, purchases]);

  // Close player and overlays on logout
  useEffect(() => {
    if (!user) {
      setSelectedMovie(null);
      setSelectedTrailer(null);
      handleClosePaystackCheckout();
      setCart([]);
    }
  }, [user]);

  // Filter tickets
  const filteredTickets = tickets.filter(tkt => {
    const matchesSearch = tkt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tkt.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tkt.producerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = tkt.price <= priceFilter;
    const matchesCategory = selectedCategory === 'all' || (tkt.category || 'movie') === selectedCategory;
    return matchesSearch && matchesPrice && matchesCategory;
  });

  const handleProceedToPay = async () => {
    if (cart.length === 0 || !user) return;
    setIsInitializingPayment(true);
    setPaymentError('');

    try {
      // Find the first item's producer id
      const producerId = cart[0].ticket.producerId;
      // Get the producer's profile to find their subaccount
      const producerProfile = await db.getUserProfile(producerId);
      const subaccount_code = producerProfile?.paystackSubaccountCode;

      // Sum cart total
      const totalCartPrice = cart.reduce((sum, item) => sum + (item.ticket.price * item.quantity), 0);

      // Create return callback url with special query parameter
      const callback_url = window.location.href;

      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          amount: totalCartPrice,
          subaccount_code: subaccount_code || null,
          callback_url
        })
      });

      const result = await res.json();

      if (result.status && result.data?.authorization_url) {
        setPendingPaystackRef(result.data.reference);
        setPaystackStep('otp'); // Set step to Awaiting Confirmation

        // Redirect to the payment gateway in the same window
        window.location.href = result.data.authorization_url;
      } else {
        setPaymentError(result.message || 'Failed to initialize Paystack transaction.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Network error.');
    } finally {
      setIsInitializingPayment(false);
    }
  };

  const handleVerifyPaystackPayment = async () => {
    if (!pendingPaystackRef) {
      // Fallback: if no ref, just confirm mock payment directly
      await handleConfirmPayment();
      return;
    }

    setIsInitializingPayment(true);
    setPaymentError('');

    try {
      const res = await fetch(`/api/paystack/verify/${pendingPaystackRef}`);
      const result = await res.json();

      if (result.status && result.data?.status === 'success') {
        await handleConfirmPayment();
      } else {
        setPaymentError(result.message || 'Payment verification failed. Please complete authorization in the secure window first.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Error verifying payment.');
    } finally {
      setIsInitializingPayment(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (cart.length === 0 || !user) return;

    try {
      // Loop over each item in the shopping cart and register purchases accordingly
      for (const item of cart) {
        for (let i = 0; i < item.quantity; i++) {
          const refId = pendingPaystackRef || `pstk_${Math.random().toString(36).substring(2, 15)}`;
          const priceVal = item.ticket.price;
          const producerEarning = priceVal * 0.8;
          const hubEarning = priceVal * 0.2;

          const newPurchase: TicketPurchase = {
            id: `tkt-pass-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
            ticketId: item.ticket.id,
            movieTitle: item.ticket.title,
            movieCoverUrl: item.ticket.coverUrl,
            buyerId: user.id,
            buyerName: user.name,
            buyerEmail: user.email,
            amountPaid: priceVal,
            producerEarning,
            hubEarning,
            paystackRef: refId,
            purchasedAt: new Date().toISOString(),
            status: 'unused'
          };

          await db.purchaseTicket(newPurchase);
        }
      }
      
      setPaystackStep('success');
      setTimeout(() => {
        handleClosePaystackCheckout();
        setCart([]); // Clear cart upon successful transaction
        onPurchaseComplete();
        loadMyPasses();
      }, 2000);

    } catch (err: any) {
      setPaymentError(err.message || 'Payment processing failed. Please try again.');
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn" id="marketplace-container">
      {/* HERO SECTION */}
      <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-slate-950 via-sky-950/40 to-slate-950 border border-white/10 p-6 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        {/* BACKGROUND DECORATIVE ELEMENTS (Glassmorphism blobs) */}
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-sky-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-gold/15 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex-1 space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1 text-xs text-gold">
            <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
            <span className="font-bold tracking-[0.2em] font-mono">PREMIERE EVENT</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Discover Ghana's <br className="hidden md:block" />
            Most Exclusive <span className="text-gold">Movie Premieres</span>
          </h2>
          <p className="text-sm md:text-base text-sky-100/70 max-w-xl leading-relaxed">
            Secure your premium entrance tickets. Direct and authentic sales splits verified on our cinema ledger and fully integrated with Paystack.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Real-Time Ticket Despatch
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
              <span className="h-2 w-2 rounded-full bg-gold" />
              Secure Paystack Split Payments
            </div>
          </div>
        </div>

        {/* LOGO HERO CARD */}
        <div className="hidden lg:block relative w-72 h-72 rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-white/5 backdrop-blur-xl p-6 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <span className="rounded-full bg-white/10 border border-white/10 px-2.5 py-1 text-[9px] text-white/80 font-mono font-bold tracking-wider">
                MEMBERSHIP PASS
              </span>
              <span className="text-xs font-bold text-gold">GH₵150 avg</span>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-display font-black text-lg text-white tracking-tighter">EVENT TICKET <span className="text-gold">HUB</span></h4>
              <p className="text-[9px] text-sky-light/80 font-mono tracking-widest leading-tight">THE ULTIMATE EVENT LEDGER</p>
            </div>
          </div>
        </div>
      </div>

      {/* USER'S PURCHASED PASSES (BUYER ONLY PORTAL) */}
      {user && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Ticket className="h-5 w-5 text-sky-light" />
                My Movie Passes
              </h3>
              <p className="text-xs text-gray-400">These are your active passes for live entry check-in at the cinema gates.</p>
            </div>
            <span className="rounded-full bg-sky-deep/10 border border-sky-light/20 px-3 py-1 text-xs text-sky-light font-mono font-bold">
              {myPasses.length} active
            </span>
          </div>

          {myPasses.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center text-xs text-gray-400">
              You haven't bought any premiere tickets yet. Browse the listing below and book your tickets!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPasses.map((pass) => (
                <div 
                  key={pass.id} 
                  className={`rounded-2xl glass-panel p-4 border flex flex-col justify-between hover:scale-[1.01] transition-transform ${
                    pass.status === 'used' ? 'border-white/5 opacity-60' : 'border-sky-light/20 sky-glow'
                  }`}
                >
                  <div className="flex gap-3">
                    <img src={pass.movieCoverUrl} alt={pass.movieTitle} className="h-16 w-16 rounded-xl object-cover shrink-0" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold font-mono uppercase tracking-wider ${
                          pass.status === 'used' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {pass.status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">GH₵{pass.amountPaid.toLocaleString()}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm truncate mt-1">{pass.movieTitle}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">Buyer: {pass.buyerName}</p>
                    </div>
                  </div>

                  {/* QR BARCODE SIMULATOR */}
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    <div className="rounded-lg bg-white p-2 flex flex-col items-center justify-center">
                      {/* Fake barcode block */}
                      <div className="w-full h-8 flex items-center justify-around overflow-hidden mb-1">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="bg-black" 
                            style={{ 
                              width: `${Math.floor(Math.random() * 3) + 1}px`, 
                              height: '100%',
                              opacity: Math.random() > 0.1 ? 1 : 0 
                            }} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono font-bold tracking-widest text-black">
                        {pass.id}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono">
                      <span>Purchased: {new Date(pass.purchasedAt).toLocaleDateString()}</span>
                      {pass.scannedAt && <span>Used: {new Date(pass.scannedAt).toLocaleTimeString()}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-2xl glass-panel border border-white/10 shadow-md">
        {/* SEARCH */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search premiere title, venue, or director..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-black/30 border border-white/5 px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:border-sky-deep focus:outline-none focus:ring-1 focus:ring-sky-deep"
          />
        </div>

        {/* PRICE SLIDER */}
        <div className="w-full md:w-72 flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono shrink-0">MAX PRICE:</span>
          <input
            type="range"
            min={20}
            max={5000}
            step={10}
            value={priceFilter}
            onChange={(e) => setPriceFilter(Number(e.target.value))}
            className="w-full accent-gold cursor-pointer"
          />
          <span className="text-sm font-bold text-gold-light font-mono shrink-0">
            GH₵{priceFilter.toLocaleString()}
          </span>
        </div>

        {/* CART TOGGLE BUTTON */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:border-gold/30 hover:bg-white/10 px-4 py-2.5 text-sm text-white transition-all font-semibold"
          id="filter-cart-toggle"
        >
          <ShoppingCart className="h-4 w-4 text-gold" />
          <span>View Cart</span>
          {totalItemsCount > 0 && (
            <span className="rounded-full bg-gold text-slate-950 font-mono font-bold text-xs px-2 py-0.5 animate-pulse">
              {totalItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', name: 'All Events', icon: Sparkles },
          { id: 'movie', name: 'Movie Premiers', icon: Play },
          { id: 'music', name: 'Music Shows', icon: Music },
          { id: 'beauty', name: 'Beauty Pageants', icon: Crown },
          { id: 'campus', name: 'Campus Shows', icon: GraduationCap },
          { id: 'other', name: 'Other Events', icon: Ticket }
        ].map((cat) => {
          const IconComponent = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300 shrink-0 ${
                isActive 
                  ? 'bg-white text-slate-950 border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                  : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              <IconComponent className={`h-3.5 w-3.5 ${isActive ? 'text-slate-950' : 'text-gray-400'}`} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* TICKETS MARKETPLACE GRID */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" />
          {selectedCategory === 'all' ? 'All Live Event Tickets' :
           selectedCategory === 'movie' ? 'Movie Premier Screenings' :
           selectedCategory === 'music' ? 'Music Shows & Concerts' :
           selectedCategory === 'beauty' ? 'Beauty Pageant Shows' :
           selectedCategory === 'campus' ? 'Campus Events & Student Shows' :
           'Other Live Shows & Events'}
        </h3>

        {filteredTickets.length === 0 ? (
          <div className="rounded-2xl glass-panel p-10 text-center">
            <Tag className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No events match your selected category and search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((tkt) => (
              <div 
                key={tkt.id} 
                className="bg-white/5 border border-white/10 rounded-[32px] p-5 flex flex-col justify-between hover:border-gold/50 transition-all duration-300 group shadow-2xl relative overflow-hidden"
              >
                {/* MOVIE POSTER COVER */}
                <div className="relative h-56 overflow-hidden rounded-2xl bg-black/60">
                  {/* CATEGORY FLOATER BADGE */}
                  <div className="absolute top-3 left-3 z-10">
                    {(() => {
                      const cat = tkt.category || 'movie';
                      const badgeStyles = {
                        movie: { bg: 'bg-cyan-500/90 text-white', label: 'Movie', icon: Play },
                        music: { bg: 'bg-fuchsia-500/90 text-white', label: 'Music', icon: Music },
                        beauty: { bg: 'bg-rose-500/90 text-white', label: 'Pageant', icon: Crown },
                        campus: { bg: 'bg-emerald-500/90 text-white', label: 'Campus', icon: GraduationCap },
                        other: { bg: 'bg-indigo-500/90 text-white', label: 'Event', icon: Ticket }
                      }[cat] || { bg: 'bg-cyan-500/90 text-white', label: 'Movie', icon: Play };
                      
                      const IconComp = badgeStyles.icon;
                      return (
                        <span className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider shadow-lg ${badgeStyles.bg}`}>
                          <IconComp className="h-2.5 w-2.5" />
                          {badgeStyles.label}
                        </span>
                      );
                    })()}
                  </div>

                  <img src={tkt.coverUrl} alt={tkt.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  {/* PLAY TRAILER FLOATER */}
                  <button 
                    onClick={() => setSelectedTrailer(tkt)}
                    className="absolute inset-0 flex items-center justify-center md:opacity-0 opacity-100 md:group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-[2px]"
                  >
                    <div className="h-11 w-11 rounded-full bg-gold flex items-center justify-center shadow-lg transform scale-95 md:scale-90 md:group-hover:scale-100 transition-all">
                      <Play className="h-4.5 w-4.5 text-slate-950 fill-current ml-0.5" />
                    </div>
                  </button>

                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                    <span className="rounded-xl bg-gold px-3 py-1.5 text-xs font-black text-slate-950 font-mono shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                      GH₵{tkt.price.toLocaleString()}
                    </span>
                    <span className="rounded-lg bg-slate-950/80 border border-white/10 px-2.5 py-1 text-[10px] text-sky-light font-mono font-bold">
                      {tkt.availableQuantity} left
                    </span>
                  </div>
                </div>

                {/* DETAILS CARD */}
                <div className="pt-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-sky-300 block uppercase">
                      PRODUCER: {tkt.producerName}
                    </span>
                    <h4 className="font-display font-black text-lg text-white group-hover:text-gold transition-colors mt-1 tracking-tight">{tkt.title}</h4>
                    <p className="text-xs text-sky-100/60 mt-2 line-clamp-3 leading-relaxed">{tkt.description}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
                    <div className="space-y-1.5 text-xs text-sky-100/70">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                        <span className="truncate font-semibold text-white/80">{tkt.venue}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-sky-light shrink-0" />
                          <span>{tkt.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-white/40 shrink-0" />
                          <span>{tkt.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => setSelectedTrailer(tkt)}
                        className="rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 py-2.5 text-xs font-bold text-white transition-all"
                      >
                        Watch Trailer
                      </button>
                      <button
                        onClick={() => addToCart(tkt)}
                        disabled={tkt.availableQuantity === 0}
                        className={`rounded-xl py-2.5 text-xs font-bold tracking-wide transition-all ${
                          tkt.availableQuantity === 0
                            ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                            : 'bg-gold text-slate-950 hover:bg-yellow-500 border border-gold/20 font-bold shadow'
                        }`}
                        id={`add-to-cart-btn-${tkt.id}`}
                      >
                        {tkt.availableQuantity === 0 ? 'SOLD OUT' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* YOUTUBE LIGHTBOX MODAL */}
      {selectedTrailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-black overflow-hidden shadow-2xl">
            <button
              onClick={() => setSelectedTrailer(null)}
              className="absolute top-3 right-3 z-10 rounded-full p-2 bg-black/80 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video bg-black relative">
              {(() => {
                const isDirectVideo = selectedTrailer.trailerUrl.startsWith('blob:') ||
                                      selectedTrailer.trailerUrl.includes('.mp4') || 
                                      selectedTrailer.trailerUrl.includes('.mov') || 
                                      selectedTrailer.trailerUrl.includes('.webm') ||
                                      selectedTrailer.trailerUrl.includes('/storage/v1/object/public/');
                if (isDirectVideo) {
                  return (
                    <video
                      ref={videoElementRef}
                      src={selectedTrailer.trailerUrl}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                      referrerPolicy="no-referrer"
                    />
                  );
                } else {
                  return (
                    <iframe
                      title={`${selectedTrailer.title} Trailer`}
                      src={selectedTrailer.trailerUrl}
                      className="w-full h-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
              })()}
            </div>

            {/* INTEGRATED VIDEO CONTROLS: FORWARD, BACKWARD, PLAY/PAUSE, AND EXIT PLAYER */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border-t border-white/10 p-4 font-mono">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSeek(-10)}
                  className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 border border-white/10"
                  title="Seek back 10 seconds"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-gold" />
                  <span>10s Back</span>
                </button>

                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="rounded-lg bg-gold/10 hover:bg-gold/20 px-3 py-2 text-xs font-bold text-gold hover:text-white transition-all flex items-center gap-1.5 border border-gold/20"
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
                  className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 border border-white/10"
                  title="Seek forward 10 seconds"
                >
                  <RotateCw className="h-3.5 w-3.5 text-gold" />
                  <span>10s Forward</span>
                </button>
              </div>

              {/* Explicit exit button */}
              <button
                type="button"
                onClick={() => setSelectedTrailer(null)}
                className="rounded-lg bg-red-500/10 hover:bg-red-500/20 px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 transition-all flex items-center gap-1.5 border border-red-500/20"
              >
                <LogOut className="h-3.5 w-3.5 rotate-180" />
                <span>Exit Player</span>
              </button>
            </div>

            <div className="p-5 border-t border-white/5">
              <h3 className="font-display text-xl font-bold text-white">{selectedTrailer.title} Trailer</h3>
              <p className="text-xs text-gray-400 mt-1">Directly curated by {selectedTrailer.producerName}. Book your premiere seats today.</p>
            </div>
          </div>
        </div>
      )}

      {/* PAYSTACK CHECKOUT SIMULATED MODAL */}
      {paystackCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl bg-[#121A21] border border-white/10 shadow-2xl font-sans text-white">
            {/* PAYSTACK HEADER BRANDING */}
            <div className="bg-[#09A5DB] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-white flex items-center justify-center p-0.5">
                  {/* Simple green checkout check */}
                  <span className="text-[#3AC5A0] font-black text-xs">p</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-wide text-white font-mono">paystack</h4>
                  <p className="text-[9px] text-white/80">Securing your payment</p>
                </div>
              </div>
              <button 
                onClick={handleClosePaystackCheckout}
                className="text-white/80 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* TRANSACTION SUMMARY */}
            <div className="bg-black/30 px-5 py-4 border-b border-white/5 max-h-48 overflow-y-auto no-scrollbar space-y-2">
              <span className="text-[10px] text-gray-400 block uppercase font-mono">Pay to ETH (Event Ticket Hub)</span>
              {cart.map((item) => (
                <div key={item.ticket.id} className="flex justify-between items-center text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="text-white font-semibold truncate block">{item.ticket.title}</span>
                    <span className="text-[10px] text-gray-400 font-mono">Qty: {item.quantity} x GH₵{item.ticket.price}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-300">
                    GH₵{(item.ticket.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                <span className="text-xs text-gold font-bold">TOTAL AMOUNT</span>
                <span className="text-sm font-mono font-bold text-[#3AC5A0]">
                  GH₵{cartTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {paymentError && (
              <div className="mx-5 mt-4 rounded bg-red-500/15 border border-red-500/20 p-2.5 text-[11px] text-red-400">
                {paymentError}
              </div>
            )}

            {/* STEP 1: REDIRECT TO PAYSTACK */}
            {paystackStep === 'details' && (
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed">
                  You are about to be redirected to the secure external Paystack Shop portal to complete your payment of <strong className="text-gold">GH₵{cartTotal.toLocaleString()}</strong>.
                </p>
                <div className="rounded-xl bg-white/5 p-3 flex items-start gap-2.5 text-xs text-gray-400 border border-white/5">
                  <ExternalLink className="h-4 w-4 shrink-0 text-gold mt-0.5" />
                  <span>The official Paystack merchant gateway will open in a new browser tab. Use standard back or cancel controls as needed.</span>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClosePaystackCheckout}
                    className="flex-1 border border-white/10 hover:bg-white/5 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all"
                  >
                    Cancel & Back
                  </button>
                  <button
                    type="button"
                    disabled={isInitializingPayment}
                    onClick={handleProceedToPay}
                    className="flex-1 bg-gold hover:bg-yellow-500 py-3 rounded-xl text-xs font-black text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(251,191,36,0.3)] disabled:opacity-50"
                  >
                    {isInitializingPayment ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <span>Proceed to Pay</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: AWAITING CONFIRMATION */}
            {paystackStep === 'otp' && (
              <div className="p-5 space-y-4 text-center">
                <div className="inline-flex h-12 w-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 items-center justify-center text-gold mb-1">
                  <Clock className="h-6 w-6 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <h5 className="font-bold text-sm text-white">Awaiting Paystack Payment</h5>
                <p className="text-xs text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                  Please finish your secure checkout on the Paystack gateway. Once you are done, click the button below to confirm your payment and claim your active passes.
                </p>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isInitializingPayment}
                    onClick={handleVerifyPaystackPayment}
                    className="w-full bg-[#3AC5A0] hover:bg-[#2fb18e] py-3 rounded-xl text-xs font-bold text-white tracking-wide transition-all shadow-[0_0_15px_rgba(58,197,160,0.3)] disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isInitializingPayment ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Verifying Payment...</span>
                      </>
                    ) : (
                      <span>Confirm Payment & Get Passes</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaystackStep('details')}
                    className="w-full border border-white/10 hover:bg-white/5 py-2.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all"
                  >
                    ← Backward / Cancel Redirect
                  </button>
                  <button
                    type="button"
                    onClick={handleClosePaystackCheckout}
                    className="w-full border border-red-500/20 hover:border-red-500/30 hover:bg-red-500/10 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 transition-all"
                  >
                    ✕ Cancel & Return to Market
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {paystackStep === 'success' && (
              <div className="p-8 text-center space-y-3 animate-fadeIn">
                <div className="inline-flex h-16 w-16 rounded-full bg-[#3AC5A0]/20 items-center justify-center text-[#3AC5A0]">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>
                <h5 className="font-bold text-lg text-white">Payment Successful</h5>
                <p className="text-xs text-gray-400">
                  Your tickets are being generated and dispatched to your <strong>My Passes</strong> dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHOPPING CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-10 animate-fadeIn" id="shopping-cart-drawer">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsCartOpen(false)}
          />
          
          <div className="relative w-screen max-w-md bg-[#0b0f19] border-l border-white/10 text-white flex flex-col h-full shadow-2xl z-10">
            {/* Drawer Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gold/10 text-gold">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white tracking-tight">Your Ticket Cart</h3>
                  <p className="text-xs text-gray-400">{totalItemsCount} {totalItemsCount === 1 ? 'ticket' : 'tickets'} selected</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-full bg-white/5 text-gray-500">
                    <ShoppingBag className="h-10 w-10" />
                  </div>
                  <h4 className="font-bold text-base text-gray-300">Your cart is empty</h4>
                  <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                    Browse Ghana's most exclusive premieres and add tickets to your cart.
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-2 rounded-xl bg-gold/10 text-gold hover:bg-gold hover:text-slate-950 border border-gold/20 px-5 py-2 text-xs font-bold transition-all"
                  >
                    Explore Screenings
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div 
                    key={item.ticket.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 hover:border-white/20 transition-all relative group"
                  >
                    <img 
                      src={item.ticket.coverUrl} 
                      alt={item.ticket.title} 
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-black/40 border border-white/10" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm truncate pr-6">{item.ticket.title}</h4>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.ticket.venue}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        {/* Quantity Controls */}
                        <div className="flex items-center bg-black/30 rounded-lg p-1 border border-white/5">
                          <button
                            onClick={() => updateQuantity(item.ticket.id, -1)}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            id={`qty-minus-${item.ticket.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2.5 text-xs font-mono font-bold text-white min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.ticket.id, 1)}
                            disabled={item.quantity >= item.ticket.availableQuantity}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            id={`qty-plus-${item.ticket.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Price computation */}
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block font-mono">GH₵{item.ticket.price} each</span>
                          <span className="text-xs font-bold text-gold font-mono">
                            GH₵{(item.ticket.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeFromCart(item.ticket.id)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-red-400 p-1 rounded-lg hover:bg-white/5 transition-all md:opacity-0 group-hover:opacity-100"
                      title="Remove item"
                      id={`remove-item-${item.ticket.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-black/40 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Subtotal ({totalItemsCount} tickets)</span>
                    <span className="font-mono">GH₵{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-white">Total Amount</span>
                    <span className="text-gold font-mono text-base">GH₵{cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={clearCart}
                    className="rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 py-3 text-xs font-bold text-gray-400 hover:text-white transition-all"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setPaystackStep('details');
                      setPaystackCheckout(true);
                    }}
                    className="rounded-xl bg-gold text-slate-950 hover:bg-yellow-500 py-3 text-xs font-black tracking-wide transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                  >
                    Checkout Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING CART BUTTON */}
      {totalItemsCount > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gold hover:bg-yellow-500 text-slate-950 p-4 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.5)] flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 group border border-yellow-300/30"
          id="floating-cart-btn"
          aria-label="View Cart"
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute -top-3 -right-3 bg-red-600 text-white font-mono font-bold text-[10px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-950">
              {totalItemsCount}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}

