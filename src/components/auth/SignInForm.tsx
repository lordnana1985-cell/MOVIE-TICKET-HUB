import React, { FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../../types';

interface SignInFormProps {
  role: UserRole;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
  onForgotPassword: () => void;
}

export default function SignInForm({
  role,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  onSubmit,
  onForgotPassword,
}: SignInFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" id="sign-in-form">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 font-mono uppercase tracking-wider flex items-center justify-between">
          <span>EMAIL ADDRESS</span>
          {role === 'admin' && (
            <span className="text-[10px] text-rose-400 font-bold tracking-wide font-mono bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
              PRELOADED ADMIN SYSTEM
            </span>
          )}
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <Mail className="h-4 w-4" />
          </span>
          <input
            type="email"
            required
            disabled={role === 'admin'}
            readOnly={role === 'admin'}
            placeholder="e.g. yourname@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full rounded-xl bg-black/30 border px-3 py-2.5 pl-10 text-sm text-white placeholder-gray-600 focus:outline-none transition-all ${
              role === 'admin'
                ? 'border-rose-500/30 text-gray-400 cursor-not-allowed bg-rose-950/10 select-none'
                : 'border-white/10 focus:border-sky-deep focus:ring-1 focus:ring-sky-deep'
            }`}
            id="auth-signin-email"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 font-mono uppercase tracking-wider">
          PASSWORD
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <Lock className="h-4 w-4" />
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-600 focus:border-sky-deep focus:outline-none focus:ring-1 focus:ring-sky-deep transition-all"
            id="auth-signin-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors focus:outline-none"
            id="toggle-signin-password"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-[11px] text-gray-400 hover:text-white hover:underline font-mono cursor-pointer"
          id="forgot-password-trigger-btn"
        >
          Forgot Password?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-xl py-3 text-sm font-semibold tracking-wide transition-all mt-4 shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center cursor-pointer ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          role === 'admin'
            ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white font-bold shadow-md shadow-rose-900/30'
            : role === 'producer'
              ? 'bg-gradient-to-r from-gold-light via-gold to-gold-dark text-black font-bold'
              : 'bg-sky-deep text-white font-bold'
        }`}
        id="page-auth-submit-btn"
      >
        {loading ? 'Processing...' : 'Authenticate & Log In'}
      </button>
    </form>
  );
}
