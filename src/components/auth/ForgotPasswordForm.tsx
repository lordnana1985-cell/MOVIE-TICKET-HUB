import React, { FormEvent } from 'react';
import { Mail, AlertCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (email: string) => void;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({
  email,
  setEmail,
  loading,
  onSubmit,
  onBackToLogin,
}: ForgotPasswordFormProps) {
  return (
    <div className="space-y-6" id="forgot-password-form-container">
      <div className="text-center lg:text-left">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-black to-white/10 border border-white/10 mb-4">
          <Mail className="h-5 w-5 text-sky-light" />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-white">
          Reset Your Password
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Provide your registered email address and we will dispatch a secure reset link.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 font-mono uppercase tracking-wider">
            REGISTERED EMAIL ADDRESS
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              required
              placeholder="yourname@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 pl-10 text-sm text-white placeholder-gray-600 focus:border-sky-deep focus:outline-none focus:ring-1 focus:ring-sky-deep transition-all"
              id="forgot-password-email"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all mt-4 shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center bg-sky-deep text-white cursor-pointer"
          id="send-reset-link-btn"
        >
          {loading ? 'Processing...' : 'Send Secure Reset Link'}
        </button>
      </form>

      {/* Supabase Redirect Advisory */}
      <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 space-y-2 text-xs text-gray-300">
        <div className="flex items-center gap-2 font-semibold text-gold">
          <AlertCircle className="h-4 w-4 shrink-0 text-gold" />
          <span>Supabase Link Configuration Guide</span>
        </div>
        <p className="leading-relaxed text-[11px] text-gray-400">
          If clicking the reset link in your email redirects you to{' '}
          <code className="text-white bg-white/10 px-1 rounded">localhost</code>, configure your
          Supabase dashboard redirect URLs:
        </p>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-black/40 border border-white/10 p-2 font-mono text-[10px] text-white">
          <span className="truncate select-all text-gold">{`${window.location.origin}${window.location.pathname}`}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}`);
            }}
            className="shrink-0 px-2 py-1 rounded bg-gold hover:bg-yellow-500 text-black font-bold text-[9px] transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={onBackToLogin}
          className="font-semibold hover:underline bg-transparent border-none cursor-pointer text-sky-light"
          id="back-to-login-btn"
        >
          Back to Login Portal
        </button>
      </div>
    </div>
  );
}
