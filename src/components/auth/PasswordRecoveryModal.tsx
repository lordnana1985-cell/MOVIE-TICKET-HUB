import React, { FormEvent } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordRecoveryModalProps {
  newPassword: string;
  setNewPassword: (p: string) => void;
  confirmPassword: string;
  setConfirmPassword: (p: string) => void;
  showPassword: boolean;
  setShowPassword: (s: boolean) => void;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
}

export default function PasswordRecoveryModal({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  loading,
  onSubmit,
}: PasswordRecoveryModalProps) {
  return (
    <div className="space-y-6">
      <div className="text-center lg:text-left">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 mb-4">
          <Lock className="h-5 w-5 text-gold" />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-white">
          Create New Password
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Enter your new credentials below to restore secure account access.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 font-mono uppercase tracking-wider">
            NEW SECURE PASSWORD
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
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 font-mono uppercase tracking-wider">
            CONFIRM NEW PASSWORD
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 pl-10 text-sm text-white placeholder-gray-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all mt-4 shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center bg-gradient-to-r from-gold-light via-gold to-gold-dark text-black cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Update My Password'}
        </button>
      </form>
    </div>
  );
}
