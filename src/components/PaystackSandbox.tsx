import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Lock, 
  X, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface PaystackSandboxProps {
  reference: string;
  amount: string | null;
}

export default function PaystackSandbox({ reference, amount }: PaystackSandboxProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'momo'>('card');
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'telecel' | 'airteltigo'>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardPin, setCardPin] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'cancelled'>('pending');
  const [errorMessage, setErrorMessage] = useState('');

  const displayAmount = amount ? Number(amount) : 150;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage('');

    // Simulate network delay for verification
    setTimeout(async () => {
      try {
        const res = await fetch('/api/paystack/demo-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference,
            status: 'success'
          })
        });
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Server returned error (${res.status}): ${text.slice(0, 100)}`);
        }
        const result = await res.json();
        if (result.status) {
          setPaymentStatus('success');
        } else {
          setErrorMessage('Failed to communicate payment status to backend.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Network error communicating with Sandbox backend.');
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/paystack/demo-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          status: 'failed'
        })
      });
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server returned error (${res.status}): ${text.slice(0, 100)}`);
      }
      const result = await res.json();
      if (result.status) {
        setPaymentStatus('cancelled');
      } else {
        setErrorMessage('Failed to communicate cancellation to backend.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during cancellation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturnToApp = (status: 'success' | 'cancelled') => {
    // Attempt window.close() first (works if it was opened in a new tab/window)
    try {
      window.close();
    } catch (e) {
      console.warn('window.close() failed:', e);
    }
    
    // Always also redirect to the main app in case it's in the same window/tab
    setTimeout(() => {
      window.location.href = window.location.origin + window.location.pathname + `?paystack_callback=true&ref=${reference}&status=${status}`;
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#333333] flex flex-col items-center justify-center p-4 select-none font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* PAYSTACK OFFICIAL INSPIRED HEADER */}
        <div className="bg-[#09A5DB] px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <span className="text-[#3AC5A0] font-black text-lg">p</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight uppercase font-mono">paystack</span>
                <span className="bg-[#3AC5A0] text-[8px] font-black tracking-widest text-white px-1.5 py-0.5 rounded uppercase">sandbox</span>
              </div>
              <p className="text-[10px] text-white/85 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> Secure Checkout Gateway
              </p>
            </div>
          </div>
          {paymentStatus === 'pending' && (
            <button 
              onClick={handleCancel}
              disabled={isProcessing}
              className="text-white/80 hover:text-white transition-colors p-1 bg-white/10 hover:bg-white/15 rounded-full"
              title="Cancel checkout"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* MERCHANT & AMOUNT SUMMARY */}
        <div className="bg-[#F8F9FA] px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Merchant Portal</span>
            <span className="text-xs font-semibold text-gray-700 truncate block">ETH - Event Ticket Hub Ghana</span>
            <span className="text-[9px] text-gray-400 font-mono block tracking-tight">Ref: {reference}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Amount Due</span>
            <span className="text-lg font-mono font-black text-[#09A5DB]">
              GH₵{displayAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600 flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PENDING VIEW */}
        {paymentStatus === 'pending' && (
          <div className="p-6">
            {/* METHOD SELECTION TABS */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${
                  paymentMethod === 'card'
                    ? 'border-[#09A5DB] bg-[#09A5DB]/5 text-[#09A5DB]'
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Pay with Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('momo')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${
                  paymentMethod === 'momo'
                    ? 'border-[#09A5DB] bg-[#09A5DB]/5 text-[#09A5DB]'
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span>Mobile Money</span>
              </button>
            </div>

            {/* PAYMENT FORM CONTENT */}
            <form onSubmit={handlePay} className="space-y-4">
              {paymentMethod === 'card' ? (
                <div className="space-y-3.5 animate-fadeIn">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="4000 1234 5678 9010"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:border-[#09A5DB] transition-all font-mono"
                      />
                      <CreditCard className="absolute right-4 top-3.5 h-4 w-4 text-gray-300" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Expiry Date</label>
                      <input
                        type="text"
                        required
                        placeholder="MM / YY"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:border-[#09A5DB] transition-all text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">CVV</label>
                      <input
                        type="password"
                        required
                        placeholder="123"
                        maxLength={3}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:border-[#09A5DB] transition-all text-center font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Card PIN</label>
                    <input
                      type="password"
                      required
                      placeholder="••••"
                      maxLength={4}
                      value={cardPin}
                      onChange={(e) => setCardPin(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:border-[#09A5DB] transition-all text-center tracking-widest font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 animate-fadeIn">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Network Provider</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setMomoProvider('mtn')}
                        className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all text-center ${
                          momoProvider === 'mtn'
                            ? 'border-yellow-400 bg-yellow-400/10 text-yellow-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        MTN MoMo
                      </button>
                      <button
                        type="button"
                        onClick={() => setMomoProvider('telecel')}
                        className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all text-center ${
                          momoProvider === 'telecel'
                            ? 'border-red-500 bg-red-500/10 text-red-600'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Telecel Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setMomoProvider('airteltigo')}
                        className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all text-center ${
                          momoProvider === 'airteltigo'
                            ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        AT Money
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="054 123 4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-300 focus:outline-none focus:border-[#09A5DB] transition-all font-mono"
                      />
                      <Smartphone className="absolute right-4 top-3.5 h-4 w-4 text-gray-300" />
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 block">A secure authorization prompt will be simulated for this number.</span>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="pt-4 space-y-2.5">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-[#3AC5A0] hover:bg-[#34b391] disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Authorizing Secure Transfer...</span>
                    </>
                  ) : (
                    <span>Pay GH₵{displayAmount.toFixed(2)}</span>
                  )}
                </button>
                
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCancel}
                  className="w-full border border-gray-200 hover:border-red-100 hover:bg-red-50/50 text-gray-500 hover:text-red-600 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center"
                >
                  Cancel Transaction
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SUCCESS VIEW */}
        {paymentStatus === 'success' && (
          <div className="p-8 text-center space-y-5 animate-fadeIn">
            <div className="inline-flex h-16 w-16 rounded-full bg-[#3AC5A0]/10 border border-[#3AC5A0]/20 items-center justify-center text-[#3AC5A0]">
              <CheckCircle2 className="h-10 w-10 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h5 className="font-bold text-base text-gray-800">Transaction Authorized!</h5>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                Payment has been successfully authorized for <strong className="text-gray-700">GH₵{displayAmount.toFixed(2)}</strong>.
              </p>
            </div>

            <div className="rounded-xl bg-[#3AC5A0]/5 p-4 text-[11px] text-[#3AC5A0] font-medium border border-[#3AC5A0]/15 leading-relaxed">
              🎉 Sandbox confirmation completed. Please click below to return to Event Ticket Hub to confirm your tickets and retrieve your passes.
            </div>

            <button
              onClick={() => handleReturnToApp('success')}
              className="w-full bg-[#09A5DB] hover:bg-[#0895c6] text-white py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
            >
              Return to Event Ticket Hub
            </button>
          </div>
        )}

        {/* CANCELLED VIEW */}
        {paymentStatus === 'cancelled' && (
          <div className="p-8 text-center space-y-5 animate-fadeIn">
            <div className="inline-flex h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 items-center justify-center text-red-500">
              <AlertCircle className="h-10 w-10" />
            </div>

            <div className="space-y-1.5">
              <h5 className="font-bold text-base text-red-600">Transaction Cancelled</h5>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                The secure checkout transaction has been cancelled. No funds have been moved.
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4 text-[11px] text-red-600 border border-red-100 leading-relaxed font-medium">
              You can now safely return back to your main marketplace.
            </div>

            <button
              onClick={() => handleReturnToApp('cancelled')}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
            >
              Return to Event Ticket Hub
            </button>
          </div>
        )}

        {/* SECURED FOOTER */}
        <div className="border-t border-gray-100 px-6 py-4 bg-[#F8F9FA] flex justify-between items-center text-[10px] text-gray-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#3AC5A0]" />
            <span>Secured by Paystack Sandbox</span>
          </div>
          <a href="https://paystack.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 font-mono tracking-tighter">
            PAYSTACK.COM
          </a>
        </div>

      </div>
    </div>
  );
}
