import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Ticket,
  ChevronRight,
  User,
  RotateCcw,
  RotateCw,
  Pause,
  LogOut,
  ShoppingCart,
  Music,
  Crown,
  GraduationCap,
} from 'lucide-react';
import { UserProfile, MovieTicket, TicketPurchase } from '../types';
import { db } from '../lib/db';
import CartDrawer, { CartItem } from './marketplace/CartDrawer';
import CheckoutFlow from './marketplace/CheckoutFlow';

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
  onOpenAuth,
}: MarketplaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState<number>(2000);
  const [selectedMovie, setSelectedMovie] = useState<MovieTicket | null>(null);
  const [selectedTrailer, setSelectedTrailer] = useState<MovieTicket | null>(null);

  // Paystack Overlay & Cart State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [myPasses, setMyPasses] = useState<TicketPurchase[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('movie_ticket_hub_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('movie_ticket_hub_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (ticket: MovieTicket) => {
    if (!user) {
      onOpenAuth('buyer');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.ticket.id === ticket.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, ticket.availableQuantity);
        return prev.map((item) =>
          item.ticket.id === ticket.id ? { ...item, quantity: newQty } : item
        );
      } else {
        return [...prev, { ticket, quantity: 1 }];
      }
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (ticketId: string) => {
    setCart((prev) => prev.filter((item) => item.ticket.id !== ticketId));
  };

  const updateQuantity = (ticketId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.ticket.id === ticketId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return { ...item, quantity: Math.min(newQty, item.ticket.availableQuantity) };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + item.ticket.price * item.quantity, 0);
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

  useEffect(() => {
    if (!user) {
      setSelectedMovie(null);
      setSelectedTrailer(null);
      setIsCheckoutOpen(false);
      setCart([]);
    }
  }, [user]);

  // Filter tickets
  const filteredTickets = tickets.filter((tkt) => {
    const matchesSearch =
      tkt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tkt.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tkt.producerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = tkt.price <= priceFilter;
    const matchesCategory = selectedCategory === 'all' || (tkt.category || 'movie') === selectedCategory;
    return matchesSearch && matchesPrice && matchesCategory;
  });

  return (
    <div className="space-y-10 animate-fadeIn" id="marketplace-container">
      {/* HERO SECTION */}
      <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-slate-950 via-sky-950/40 to-slate-950 border border-white/10 p-6 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-sky-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-gold/15 rounded-full blur-[100px] pointer-events-none" />

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
            Secure your premium entrance tickets. Direct and authentic sales splits verified on our cinema
            ledger and fully integrated with Paystack.
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
        <div className="w-full md:w-80 rounded-2xl bg-black/40 border border-white/10 p-6 backdrop-blur-xl relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-sky-300">HUB STATUS</span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              ONLINE
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Active Screenings:</span>
              <span className="font-bold font-mono text-white">{tickets.length}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-300">
              <span>Revenue Split:</span>
              <span className="font-bold font-mono text-gold">80% / 20%</span>
            </div>
            <div className="flex justify-between text-xs text-gray-300">
              <span>Settlement:</span>
              <span className="font-bold font-mono text-sky-light">Instant Mobile Money</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by event title, producer, or venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl bg-slate-900/80 border border-white/10 pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold transition-all shadow-inner"
              id="marketplace-search-input"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {[
              { id: 'all', label: 'All Events', icon: Ticket },
              { id: 'movie', label: 'Movies', icon: Play },
              { id: 'music', label: 'Concerts', icon: Music },
              { id: 'beauty', label: 'Pageants', icon: Crown },
              { id: 'campus', label: 'Campus', icon: GraduationCap },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-gold text-slate-950 shadow-md shadow-gold/20'
                      : 'bg-slate-900/60 text-gray-400 hover:text-white border border-white/5'
                  }`}
                  id={`cat-filter-${cat.id}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TICKETS GRID */}
      <div>
        {filteredTickets.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-12 text-center space-y-4">
            <Ticket className="h-12 w-12 text-gray-600 mx-auto" />
            <h3 className="font-display font-bold text-xl text-white">No screening events found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Try adjusting your search criteria or category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="tickets-grid">
            {filteredTickets.map((tkt) => (
              <div
                key={tkt.id}
                className="group relative rounded-3xl bg-slate-900/60 border border-white/10 hover:border-gold/40 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-gold/5"
              >
                {/* Poster Cover */}
                <div className="relative h-56 overflow-hidden rounded-2xl bg-black/60">
                  <div className="absolute top-3 left-3 z-10">
                    {(() => {
                      const cat = tkt.category || 'movie';
                      const badgeStyles =
                        {
                          movie: { bg: 'bg-cyan-500/90 text-white', label: 'Movie', icon: Play },
                          music: { bg: 'bg-fuchsia-500/90 text-white', label: 'Music', icon: Music },
                          beauty: { bg: 'bg-rose-500/90 text-white', label: 'Pageant', icon: Crown },
                          campus: {
                            bg: 'bg-emerald-500/90 text-white',
                            label: 'Campus',
                            icon: GraduationCap,
                          },
                          other: { bg: 'bg-indigo-500/90 text-white', label: 'Event', icon: Ticket },
                        }[cat] || { bg: 'bg-cyan-500/90 text-white', label: 'Movie', icon: Play };

                      const IconComp = badgeStyles.icon;
                      return (
                        <span
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider shadow-lg ${badgeStyles.bg}`}
                        >
                          <IconComp className="h-2.5 w-2.5" />
                          {badgeStyles.label}
                        </span>
                      );
                    })()}
                  </div>

                  <img
                    src={tkt.coverUrl}
                    alt={tkt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Play Trailer Floater */}
                  <button
                    onClick={() => setSelectedTrailer(tkt)}
                    className="absolute inset-0 flex items-center justify-center md:opacity-0 opacity-100 md:group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-[2px] cursor-pointer"
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

                {/* Details Card */}
                <div className="pt-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-sky-300 block uppercase">
                      PRODUCER: {tkt.producerName}
                    </span>
                    <h4 className="font-display font-black text-lg text-white group-hover:text-gold transition-colors mt-1 tracking-tight">
                      {tkt.title}
                    </h4>
                    <p className="text-xs text-sky-100/60 mt-2 line-clamp-3 leading-relaxed">
                      {tkt.description}
                    </p>
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
                        className="rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 py-2.5 text-xs font-bold text-white transition-all cursor-pointer"
                      >
                        Watch Trailer
                      </button>
                      <button
                        onClick={() => addToCart(tkt)}
                        disabled={tkt.availableQuantity === 0}
                        className={`rounded-xl py-2.5 text-xs font-bold tracking-wide transition-all cursor-pointer ${
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

      {/* YOUTUBE / VIDEO LIGHTBOX MODAL */}
      {selectedTrailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-black overflow-hidden shadow-2xl">
            <button
              onClick={() => setSelectedTrailer(null)}
              className="absolute top-3 right-3 z-10 rounded-full p-2 bg-black/80 text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video bg-black relative">
              {(() => {
                const isDirectVideo =
                  selectedTrailer.trailerUrl.startsWith('blob:') ||
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
                onClick={() => setSelectedTrailer(null)}
                className="rounded-lg bg-red-500/10 hover:bg-red-500/20 px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 transition-all flex items-center gap-1.5 border border-red-500/20 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 rotate-180" />
                <span>Exit Player</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHOPPING CART DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        totalItemsCount={totalItemsCount}
        cartTotal={cartTotal}
        onUpdateQuantity={updateQuantity}
        onRemoveFromCart={removeFromCart}
        onClearCart={clearCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* CHECKOUT FLOW */}
      <CheckoutFlow
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        user={user}
        onPurchaseComplete={onPurchaseComplete}
        onClearCart={clearCart}
      />

      {/* FLOATING CART BUTTON */}
      {totalItemsCount > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gold hover:bg-yellow-500 text-slate-950 p-4 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.5)] flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 group border border-yellow-300/30 cursor-pointer"
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
