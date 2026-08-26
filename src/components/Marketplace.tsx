import React, { useState, useEffect } from 'react';
import { Search, Play, Music, Crown, GraduationCap, Ticket, ShoppingCart } from 'lucide-react';
import { UserProfile, MovieTicket, TicketPurchase } from '../types';
import { db } from '../lib/db';
import { logger } from '../lib/logger';
import CartDrawer, { CartItem } from './marketplace/CartDrawer';
import CheckoutFlow from './marketplace/CheckoutFlow';
import MarketplaceHero from './marketplace/MarketplaceHero';
import EventTicketCard from './marketplace/EventTicketCard';
import TrailerLightboxModal from './marketplace/TrailerLightboxModal';

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

  const loadMyPasses = async () => {
    if (!user) return;
    try {
      const myTickets = await db.getPurchasesForBuyer(user.id);
      setMyPasses(myTickets);
    } catch (e: any) {
      logger.error('Failed to load my purchased passes:', 'Marketplace', {
        error: e?.message || e,
      });
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
    const matchesCategory =
      selectedCategory === 'all' || (tkt.category || 'movie') === selectedCategory;
    return matchesSearch && matchesPrice && matchesCategory;
  });

  return (
    <div className="space-y-10 animate-fadeIn" id="marketplace-container">
      {/* HERO SECTION */}
      <MarketplaceHero activeScreeningsCount={tickets.length} />

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
                  type="button"
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
              <EventTicketCard
                key={tkt.id}
                ticket={tkt}
                onWatchTrailer={(t) => setSelectedTrailer(t)}
                onAddToCart={(t) => addToCart(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* YOUTUBE / VIDEO LIGHTBOX MODAL */}
      <TrailerLightboxModal ticket={selectedTrailer} onClose={() => setSelectedTrailer(null)} />

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
