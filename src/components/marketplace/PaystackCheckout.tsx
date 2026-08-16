import React from 'react';
import { 
  X, 
  ExternalLink, 
  ArrowRight, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { CartItem } from '../../types';

export type PaystackStep = 'details' | 'otp' | 'success';

interface PaystackCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  cartTotal: number;
  paystackStep: PaystackStep;
  setPaystackStep: (step: PaystackStep) => void;
  paymentError: string;
  isInitializingPayment: boolean;
  onProceedToPay: () => void;
  onVerifyPayment: () => void;
}

export default function PaystackCheckout({
  isOpen,
  onClose,
  cart,
  cartTotal,
  paystackStep,
  setPaystackStep,
  paymentError,
  isInitializingPayment,
  onProceedToPay,
  onVerifyPayment
}: PaystackCheckoutProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl bg-[#121A21] border border-white/10 shadow-2xl font-sans text-white">
        {/* PAYSTACK HEADER BRANDING */}
        <div className="bg-[#09A5DB] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-white flex items-center justify-center p-0.5">
              <span className="text-[#3AC5A0] font-black text-xs">p</span>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-wide text-white font-mono">paystack</h4>
              <p className="text-[9px] text-white/80">Securing your payment</p>
            </div>
          </div>
          <button 
            onClick={onClose}
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
              <span>The official Paystack merchant gateway will load in this browser window. Use standard back or cancel controls as needed.</span>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-white/10 hover:bg-white/5 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all"
              >
                Cancel & Back
              </button>
              <button
                type="button"
                disabled={isInitializingPayment}
                onClick={onProceedToPay}
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
                onClick={onVerifyPayment}
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
                onClick={onClose}
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
  );
}
