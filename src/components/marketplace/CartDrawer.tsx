import React from 'react';
import { ShoppingCart, X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { MovieTicket } from '../../types';

export interface CartItem {
  ticket: MovieTicket;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  totalItemsCount: number;
  cartTotal: number;
  onUpdateQuantity: (ticketId: string, delta: number) => void;
  onRemoveFromCart: (ticketId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  totalItemsCount,
  cartTotal,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-10 animate-fadeIn"
      id="shopping-cart-drawer"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        id="cart-drawer-backdrop"
      />

      <div className="relative w-screen max-w-md bg-[#0b0f19] border-l border-white/10 text-white flex flex-col h-full shadow-2xl z-10">
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/10 text-gold">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white tracking-tight">
                Your Ticket Cart
              </h3>
              <p className="text-xs text-gray-400">
                {totalItemsCount} {totalItemsCount === 1 ? 'ticket' : 'tickets'} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            id="close-cart-drawer-btn"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items List */}
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
                onClick={onClose}
                className="mt-2 rounded-xl bg-gold/10 text-gold hover:bg-gold hover:text-slate-950 border border-gold/20 px-5 py-2 text-xs font-bold transition-all cursor-pointer"
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
                    <h4 className="font-bold text-white text-sm truncate pr-6">
                      {item.ticket.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.ticket.venue}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    {/* Quantity Controls */}
                    <div className="flex items-center bg-black/30 rounded-lg p-1 border border-white/5">
                      <button
                        onClick={() => onUpdateQuantity(item.ticket.id, -1)}
                        className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        id={`qty-minus-${item.ticket.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2.5 text-xs font-mono font-bold text-white min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.ticket.id, 1)}
                        disabled={item.quantity >= item.ticket.availableQuantity}
                        className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        id={`qty-plus-${item.ticket.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Price computation */}
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block font-mono">
                        GH₵{item.ticket.price} each
                      </span>
                      <span className="text-xs font-bold text-gold font-mono">
                        GH₵{(item.ticket.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveFromCart(item.ticket.id)}
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
                <span className="text-gold font-mono text-base">
                  GH₵{cartTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onClearCart}
                className="rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 py-3 text-xs font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
                id="clear-cart-btn"
              >
                Clear Cart
              </button>
              <button
                onClick={onCheckout}
                className="rounded-xl bg-gold text-slate-950 hover:bg-yellow-500 py-3 text-xs font-black tracking-wide transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] cursor-pointer"
                id="drawer-checkout-btn"
              >
                Checkout Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
