import React, { FormEvent } from 'react';
import { User, Mail, Lock, Building, Phone, Shield, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../../types';

interface SignUpFormProps {
  role: UserRole;
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  companyName: string;
  setCompanyName: (companyName: string) => void;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  selectedBankCode: string;
  setSelectedBankCode: (code: string) => void;
  bankList: { name: string; code: string }[];
  isLoadingBanks: boolean;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
}

export default function SignUpForm({
  role,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  companyName,
  setCompanyName,
  phoneNumber,
  setPhoneNumber,
  selectedBankCode,
  setSelectedBankCode,
  bankList,
  isLoadingBanks,
  loading,
  onSubmit,
}: SignUpFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" id="sign-up-form">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 font-mono uppercase tracking-wider">
          FULL NAME
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <User className="h-4 w-4" />
          </span>
          <input
            type="text"
            required
            placeholder="e.g. Christopher Nolan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 pl-10 text-sm text-white placeholder-gray-600 focus:border-sky-deep focus:outline-none focus:ring-1 focus:ring-sky-deep transition-all"
            id="auth-signup-name"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 font-mono uppercase tracking-wider">
          EMAIL ADDRESS
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <Mail className="h-4 w-4" />
          </span>
          <input
            type="email"
            required
            placeholder="e.g. yourname@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 pl-10 text-sm text-white placeholder-gray-600 focus:border-sky-deep focus:outline-none focus:ring-1 focus:ring-sky-deep transition-all"
            id="auth-signup-email"
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
            id="auth-signup-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors focus:outline-none"
            id="toggle-signup-password"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {role === 'producer' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 font-mono uppercase tracking-wider">
              ORGANISATION / EVENT COMPANY
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Building className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                placeholder="e.g. Sync Cinema Studios"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 pl-10 text-sm text-white placeholder-gray-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                id="auth-signup-company"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 font-mono uppercase tracking-wider flex items-center gap-1">
              PHONE NUMBER <span className="text-[10px] text-gold-light font-normal font-sans">(For receiving payout of sales)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Phone className="h-4 w-4" />
              </span>
              <input
                type="tel"
                required
                placeholder="e.g. +234 803 123 4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 pl-10 text-sm text-white placeholder-gray-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                id="auth-signup-phone"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 font-mono uppercase tracking-wider flex items-center gap-1">
              Settlement Bank <span className="text-[10px] text-gold-light font-normal font-sans">(For receiving automatic payouts)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Shield className="h-4 w-4" />
              </span>
              <select
                value={selectedBankCode}
                onChange={(e) => setSelectedBankCode(e.target.value)}
                disabled={isLoadingBanks}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 pl-10 text-sm text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all cursor-pointer"
                id="auth-signup-bank"
              >
                {isLoadingBanks ? (
                  <option>Loading banks list...</option>
                ) : bankList.length === 0 ? (
                  <option>No banks found</option>
                ) : (
                  bankList.map((bank) => (
                    <option key={bank.code} value={bank.code} className="bg-slate-900 text-white">
                      {bank.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-xl py-3 text-sm font-semibold tracking-wide transition-all mt-4 shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center cursor-pointer ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          role === 'producer'
            ? 'bg-gradient-to-r from-gold-light via-gold to-gold-dark text-black font-bold'
            : 'bg-sky-deep text-white font-bold'
        }`}
        id="page-auth-signup-submit-btn"
      >
        {loading ? 'Processing...' : 'Register Account'}
      </button>
    </form>
  );
}
