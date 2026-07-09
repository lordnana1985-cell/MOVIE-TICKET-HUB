import { Phone, MessageSquare, HelpCircle, X, Check } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Custom SVG for WhatsApp Logo (crisp, brand-accurate green and white layout)
export function WhatsAppLogoSvg({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.012 2C6.48 2 2 6.48 2 12.012c0 1.764.462 3.42 1.272 4.884L2 22l5.244-1.218c1.398.762 2.994 1.194 4.71 1.194l.006-.006c5.526 0 10.02-4.488 10.02-10.02C22.02 6.48 17.538 2 12.012 2zm6.276 14.394c-.258.732-1.296 1.332-1.8 1.404-.456.066-.996.114-2.922-.648-2.46-.978-4.05-3.486-4.17-3.648-.126-.162-.99-1.32-.99-2.52 0-1.2.624-1.794.846-2.04.228-.246.492-.306.66-.306.162 0 .33.006.474.012.15.006.348-.06.546.42.204.498.696 1.704.756 1.83.06.12.102.264.018.432-.084.168-.132.27-.258.42-.126.15-.264.336-.378.45-.126.126-.258.264-.108.522.15.258.666 1.104 1.428 1.782.978.87 1.8-.102 2.052-.354.258-.258.498-.336.756-.228.258.108 1.638.774 1.92.912.282.138.468.21.534.324.072.114.072.66-.186 1.392z" />
    </svg>
  );
}

// Custom SVG for Call Phone (glossy metallic/neon layout)
export function PhoneLogoSvg({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// Inline support component for embedded sections (e.g. dashboards)
export function EmbeddedSupportCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('0543198585');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl glass-panel-gold border border-gold/20 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden" id="embedded-support-card">
      <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-gold/5 blur-3xl pointer-events-none" />
      
      <div className="space-y-3 text-center md:text-left z-10">
        <div className="flex items-center justify-center md:justify-start gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold tracking-widest text-gold uppercase font-mono">SUPPORT ONLINE</span>
        </div>
        <h3 className="text-xl md:text-2xl font-display font-bold text-white">Need Assistance or Split Payout Info?</h3>
        <p className="text-sm text-gray-300 max-w-xl leading-relaxed">
          Our producers and ticket buyers can receive immediate assistance regarding movie setups, tickets, and split disbursements via WhatsApp or direct voice call.
        </p>
      </div>

      <div className="flex flex-col items-center sm:items-stretch gap-4 shrink-0 z-10 w-full sm:w-auto">
        <div className="flex items-center justify-between gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-white text-base font-bold">
          <span className="text-gray-400 text-xs uppercase tracking-wider font-sans">Support line:</span>
          <span>0543198585</span>
          <button 
            onClick={handleCopy}
            className="text-gold hover:text-white transition-colors p-1"
            title="Copy Number"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <span className="text-xs font-sans text-gold hover:underline">Copy</span>}
          </button>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {/* WhatsApp Image Button */}
          <a
            href="https://wa.me/233543198585"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] text-white hover:bg-[#20ba59] transition-all font-bold text-xs shadow-[0_4px_20px_rgba(37,211,102,0.3)] hover:scale-[1.03]"
          >
            <WhatsAppLogoSvg className="w-4.5 h-4.5 text-white" />
            <span>Chat on WhatsApp</span>
          </a>

          {/* Call Image Button */}
          <a
            href="tel:0543198585"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-deep to-sky-light text-white font-bold text-xs shadow-[0_4px_20px_rgba(14,165,233,0.3)] hover:scale-[1.03] transition-all"
          >
            <PhoneLogoSvg className="w-4 h-4 text-white" />
            <span>Call Customer Service</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CustomerSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none" id="customer-support-floating-wrapper">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="pointer-events-auto w-80 rounded-2xl glass-panel p-5 shadow-2xl border border-gold/20 relative overflow-hidden bg-slate-950/95 backdrop-blur-lg"
          >
            {/* Ambient gold background glow */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold tracking-widest text-gold uppercase">CUSTOMER SUPPORT</h4>
                  <p className="text-[10px] text-gray-400">Available via Chat or Call</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                id="close-support-popover-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* BODY */}
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <span className="text-[9px] text-gray-400 font-mono tracking-wider uppercase block mb-1">Customer Service Number</span>
                <span className="text-lg font-mono font-black text-white block">0543198585</span>
                <p className="text-[11px] text-gray-300 mt-1">
                  Connect instantly for rapid queries, split calculations, gate operations, or platform support.
                </p>
              </div>

              {/* ACTION CALL TO ACTIONS - Brand Images look */}
              <div className="flex flex-col gap-2.5">
                {/* WHATSAPP ACTION BUTTON */}
                <a
                  href="https://wa.me/233543198585"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-3.5 px-4 py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-[0_4px_15px_rgba(37,211,102,0.25)] hover:bg-[#20ba59] hover:shadow-[0_4px_25px_rgba(37,211,102,0.4)] transition-all overflow-hidden"
                  id="whatsapp-cta-floating"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="bg-white/20 p-2 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                    <WhatsAppLogoSvg className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">WhatsApp Chat</span>
                    <span className="block text-[10px] font-normal text-white/80 font-mono">Chat instantly with support</span>
                  </div>
                </a>

                {/* TELEPHONE CALL ACTION BUTTON */}
                <a
                  href="tel:0543198585"
                  className="group relative flex items-center gap-3.5 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-deep to-sky-light text-white font-bold text-xs shadow-[0_4px_15px_rgba(14,165,233,0.25)] hover:shadow-[0_4px_25px_rgba(14,165,233,0.4)] transition-all overflow-hidden"
                  id="phone-cta-floating"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="bg-white/20 p-2 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                    <PhoneLogoSvg className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">Direct Phone Call</span>
                    <span className="block text-[10px] font-normal text-white/80 font-mono">Dial support directly</span>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION BUTTON */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <AnimatePresence>
          {hovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              className="bg-slate-900 border border-gold/30 text-white font-bold font-mono text-xs rounded-xl px-3.5 py-2 shadow-xl whitespace-nowrap"
            >
              Support: <span className="text-gold">0543198585</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={`h-14 w-14 rounded-full flex items-center justify-center cursor-pointer shadow-2xl relative transition-all duration-300 border ${
            isOpen 
              ? 'bg-slate-800 border-white/20 text-white shadow-black/50' 
              : 'bg-gradient-to-tr from-gold via-gold-dark to-amber-600 border-gold-light text-slate-950 shadow-gold/25'
          }`}
          style={{ boxShadow: isOpen ? undefined : '0 0 25px rgba(251, 191, 36, 0.45)' }}
          id="customer-support-floating-button"
        >
          {/* Double ring pulse for attention when closed */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-gold/30 animate-ping -z-10" />
          )}
          
          {isOpen ? (
            <X className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <div className="relative">
              <HelpCircle className="w-7 h-7 stroke-[2.5]" />
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 rounded-full h-3.5 w-3.5 border-2 border-slate-950 flex items-center justify-center">
                <span className="h-1 w-1 bg-white rounded-full animate-pulse" />
              </span>
            </div>
          )}
        </motion.button>
      </div>
    </div>
  );
}
