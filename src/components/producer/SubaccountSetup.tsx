import React, { FormEvent } from 'react';
import { Percent } from 'lucide-react';
import { UserProfile } from '../../types';

interface SubaccountSetupProps {
  user: UserProfile;
  bankSubaccount?: string;
  bankList: { name: string; code: string }[];
  isLoadingBanks: boolean;
  isSubmittingSubaccount: boolean;
  subaccountError: string;
  subaccountSuccess: string;
  isEditingSubaccount: boolean;
  setIsEditingSubaccount: (editing: boolean) => void;
  setupCountry: 'GHS' | 'NGN';
  setSetupCountry: (country: 'GHS' | 'NGN') => void;
  setupBusinessName: string;
  setSetupBusinessName: (name: string) => void;
  setupBankCode: string;
  setSetupBankCode: (code: string) => void;
  setupAccountNumber: string;
  setSetupAccountNumber: (acc: string) => void;
  showVerificationInput: boolean;
  userEnteredCode: string;
  setUserEnteredCode: (code: string) => void;
  verificationError: string;
  resendCooldown: number;
  handleResendCode: () => void;
  handleCreateSubaccount: (e: FormEvent) => void;
  onCancelEdit: () => void;
}

export default function SubaccountSetup({
  user,
  bankSubaccount,
  bankList,
  isLoadingBanks,
  isSubmittingSubaccount,
  subaccountError,
  subaccountSuccess,
  isEditingSubaccount,
  setIsEditingSubaccount,
  setupCountry,
  setSetupCountry,
  setupBusinessName,
  setSetupBusinessName,
  setupBankCode,
  setSetupBankCode,
  setupAccountNumber,
  setSetupAccountNumber,
  showVerificationInput,
  userEnteredCode,
  setUserEnteredCode,
  verificationError,
  resendCooldown,
  handleResendCode,
  handleCreateSubaccount,
  onCancelEdit,
}: SubaccountSetupProps) {
  return (
    <div
      className="rounded-2xl glass-panel p-5 border border-gold/15 shadow-md space-y-4"
      id="producer-subaccount-setup"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h4 className="font-display text-sm font-black text-white flex items-center gap-2">
          <Percent className="h-4 w-4 text-gold" />
          80/20 Payout Subaccount
        </h4>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
            bankSubaccount
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : 'bg-gold/15 text-gold border border-gold/25'
          }`}
        >
          {bankSubaccount ? 'ACTIVE' : 'PENDING'}
        </span>
      </div>

      {bankSubaccount && !isEditingSubaccount ? (
        <div className="space-y-3.5 animate-fadeIn">
          <p className="text-xs text-gray-400 leading-relaxed">
            Automatic split is configured. When buyers purchase tickets,{' '}
            <strong className="text-gold">80%</strong> will go directly to your registered bank
            account below, and <strong className="text-sky-light">20%</strong> to the platform.
          </p>

          <div className="rounded-xl bg-white/5 border border-white/5 p-3.5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Subaccount Code</span>
              <span className="font-mono font-bold text-white">{bankSubaccount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Recipient Bank</span>
              <span className="font-bold text-gray-200">
                {bankList.find((b) => b.code === user.settlementBank)?.name ||
                  user.settlementBank ||
                  'Connected Bank'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Account Number</span>
              <span className="font-mono text-gray-200">
                ••••{user.accountNumber?.slice(-4) || '••••'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Registered Name</span>
              <span className="font-semibold text-gray-200">
                {user.businessName || user.companyName || user.name}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingSubaccount(true)}
            className="w-full rounded-xl border border-white/10 hover:border-white/25 hover:bg-white/5 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
            id="edit-payout-bank-btn"
          >
            Edit Payout Settlement Bank
          </button>
        </div>
      ) : (
        <form onSubmit={handleCreateSubaccount} className="space-y-3 animate-fadeIn">
          <p className="text-xs text-gray-400 leading-normal">
            Configure your business bank details below to automatically receive 80% of ticket
            revenues directly via Paystack split-checkout.
          </p>

          {subaccountError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-[11px] text-red-400 font-medium">
              ⚠️ {subaccountError}
            </div>
          )}

          {subaccountSuccess && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-400 font-medium">
              ✓ {subaccountSuccess}
            </div>
          )}

          <div className="space-y-2 text-xs">
            {/* COUNTRY SELECT */}
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">
                Settlement Currency & Bank Location
              </label>
              <select
                value={setupCountry}
                onChange={(e) => setSetupCountry(e.target.value as 'GHS' | 'NGN')}
                disabled={showVerificationInput || isLoadingBanks}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold outline-none font-medium disabled:opacity-50"
              >
                <option value="GHS">Ghana (GHS / GH₵)</option>
                <option value="NGN">Nigeria (NGN / ₦)</option>
              </select>
            </div>

            {/* BUSINESS NAME */}
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">
                Recipient / Business Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Silverbird Cinemas"
                value={setupBusinessName}
                onChange={(e) => setSetupBusinessName(e.target.value)}
                disabled={showVerificationInput}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold outline-none disabled:opacity-50"
              />
            </div>

            {/* SETTLEMENT BANK DROPDOWN */}
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">
                Select Settlement Bank
              </label>
              <select
                required
                value={setupBankCode}
                onChange={(e) => setSetupBankCode(e.target.value)}
                disabled={isLoadingBanks || showVerificationInput}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-gold outline-none disabled:opacity-50"
              >
                {isLoadingBanks ? (
                  <option>Loading banks list...</option>
                ) : bankList.length === 0 ? (
                  <option>No banks found</option>
                ) : (
                  bankList.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* ACCOUNT NUMBER */}
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">
                Bank Account / Momo Number
              </label>
              <input
                type="text"
                required
                pattern="[0-9]+"
                maxLength={20}
                placeholder="e.g. 0244123456 or 10200456789"
                value={setupAccountNumber}
                onChange={(e) => setSetupAccountNumber(e.target.value.replace(/\D/g, ''))}
                disabled={showVerificationInput}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:border-gold outline-none disabled:opacity-50"
              />
              {user.phoneNumber && !user.accountNumber && (
                <p className="text-[11px] text-gold/95 mt-1 leading-normal flex items-center gap-1 font-sans font-medium">
                  ✓ Automatically prefilled with your registered phone number for payouts.
                </p>
              )}
            </div>
          </div>

          {/* SECURE VERIFICATION CODE INPUT BLOCK */}
          {showVerificationInput && (
            <div className="rounded-xl bg-gold/5 border border-gold/25 p-3.5 space-y-3 animate-fadeIn mt-3">
              <div className="text-xs font-semibold text-gold flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <span>🔒 Secure Account Verification</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-normal">
                For your security, a 4-digit confirmation code has been sent to your email:{' '}
                <strong className="text-white">{user.email}</strong>. Please enter the code below to
                authorize changing your payout settlement account.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase text-gray-400">
                  4-Digit Security Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="e.g. 1234"
                  value={userEnteredCode}
                  onChange={(e) => setUserEnteredCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-gold/30 rounded-xl px-3 py-2.5 text-center font-mono text-xl tracking-widest text-gold font-bold focus:border-gold outline-none"
                />
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>Didn't receive the email?</span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0}
                    className="text-gold hover:underline font-medium text-[11px] disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>

              {verificationError && (
                <div className="text-[11px] text-red-400 font-medium text-center font-mono">
                  ⚠️ {verificationError}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex gap-2">
            {bankSubaccount && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex-1 rounded-xl border border-white/10 hover:bg-white/5 py-2 text-xs font-semibold text-gray-400 transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={
                isSubmittingSubaccount ||
                isLoadingBanks ||
                (showVerificationInput && userEnteredCode.length < 4)
              }
              className="flex-1 rounded-xl bg-gold hover:bg-yellow-500 py-2.5 text-xs font-bold text-slate-950 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(251,191,36,0.15)] cursor-pointer"
            >
              {isSubmittingSubaccount ? (
                <>
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-slate-950"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Saving account changes...</span>
                </>
              ) : (
                <span>
                  {showVerificationInput ? 'Verify & Save Changes' : 'Register & Link Account'}
                </span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
