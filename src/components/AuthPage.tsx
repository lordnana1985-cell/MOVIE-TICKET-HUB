import React, { useState, useEffect } from 'react';
import { User, Shield, Film, CheckCircle2, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { useBankList } from '../hooks/useBankList';
import { useAuthForm } from '../hooks/useAuthForm';
import SignInForm from './auth/SignInForm';
import SignUpForm from './auth/SignUpForm';
import ForgotPasswordForm from './auth/ForgotPasswordForm';
import PasswordRecoveryModal from './auth/PasswordRecoveryModal';
import AuthHeroBanner from './auth/AuthHeroBanner';

interface AuthPageProps {
  initialRole: UserRole;
  onAuthSuccess: (user: UserProfile) => void;
  onCancel?: () => void;
}

export default function AuthPage({
  initialRole,
  onAuthSuccess,
  onCancel,
}: AuthPageProps) {
  const [showAdminTab, setShowAdminTab] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('admin') === 'true' || urlParams.get('showAdmin') === 'true') {
        return true;
      }
      return localStorage.getItem('mt_hub_show_admin_tab') === 'true';
    } catch {
      return false;
    }
  });
  const [logoClicks, setLogoClicks] = useState(0);

  const {
    bankList,
    isLoading: isLoadingBanks,
    selectedBankCode,
    setSelectedBankCode,
  } = useBankList({
    currency: 'GHS',
    enabled: initialRole === 'producer',
  });

  const {
    role,
    setRole,
    isRegister,
    setIsRegister,
    isForgotPassword,
    setIsForgotPassword,
    isRecoveryMode,
    email,
    setEmail,
    password,
    setPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    name,
    setName,
    companyName,
    setCompanyName,
    phoneNumber,
    setPhoneNumber,
    error,
    setError,
    success,
    setSuccess,
    loading,
    pendingVerificationEmail,
    resending,
    resendCooldown,
    handleResendVerification,
    handleForgotPasswordSubmit,
    handleRecoverySubmit,
    handleSubmit,
  } = useAuthForm({
    initialRole,
    onAuthSuccess,
    selectedBankCode,
  });

  useEffect(() => {
    const handleToggle = () => {
      const nextState = localStorage.getItem('mt_hub_show_admin_tab') === 'true';
      setShowAdminTab(nextState);
    };
    window.addEventListener('mt_hub_toggle_admin_tab', handleToggle);
    return () => {
      window.removeEventListener('mt_hub_toggle_admin_tab', handleToggle);
    };
  }, []);

  useEffect(() => {
    if (!showAdminTab && role === 'admin') {
      setRole('buyer');
    }
  }, [showAdminTab, role, setRole]);

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setSuccess('');
    setPassword('');
    setName('');
    setCompanyName('');
    setPhoneNumber('');
  };

  return (
    <div
      className="w-full max-w-6xl mx-auto rounded-3xl overflow-hidden border border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-2xl relative animate-fadeIn"
      id="auth-page-container"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-deep via-gold to-gold-dark" />

      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* Left Column Marketing / Brand Banner */}
        <AuthHeroBanner onCancel={onCancel} />

        {/* Right Column Auth Forms */}
        <div className="flex-1 p-6 md:p-12 flex flex-col justify-center relative">
          {onCancel && (
            <div className="lg:hidden mb-6">
              <button
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-gray-400 hover:text-white transition-colors uppercase font-mono cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Marketplace
              </button>
            </div>
          )}

          <div className="w-full max-w-md mx-auto space-y-6">
            {isRecoveryMode ? (
              <PasswordRecoveryModal
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                loading={loading}
                onSubmit={handleRecoverySubmit}
              />
            ) : isForgotPassword ? (
              <ForgotPasswordForm
                email={email}
                setEmail={setEmail}
                loading={loading}
                onSubmit={handleForgotPasswordSubmit}
                onBackToLogin={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccess('');
                }}
              />
            ) : (
              <>
                <div className="text-center lg:text-left">
                  <div
                    onClick={() => {
                      const newClicks = logoClicks + 1;
                      setLogoClicks(newClicks);
                      if (newClicks >= 5) {
                        const nextState = !showAdminTab;
                        localStorage.setItem('mt_hub_show_admin_tab', String(nextState));
                        window.dispatchEvent(new Event('mt_hub_toggle_admin_tab'));
                        setLogoClicks(0);
                      }
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-black to-white/10 border border-white/10 mb-4 cursor-pointer select-none active:scale-95 transition-all"
                    title="Portal Trigger"
                  >
                    <Film
                      className={`h-5 w-5 ${
                        role === 'admin'
                          ? 'text-rose-500'
                          : role === 'producer'
                          ? 'text-gold'
                          : 'text-sky-light'
                      }`}
                    />
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                    {role === 'admin'
                      ? 'Admin Control Portal'
                      : role === 'producer'
                      ? 'Organiser Portal'
                      : 'Buyer Portal'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {isRegister
                      ? 'Register your event organiser or buyer profile'
                      : role === 'admin'
                      ? 'SIGN IN TO DEPLOY AND REGULATE CINEMAS'
                      : role === 'producer'
                      ? 'SIGN IN TO PUBLISH LIVE EVENT TICKETS'
                      : 'Sign in to access tickets, trailers and events'}
                  </p>
                </div>

                <div
                  className={`grid ${
                    showAdminTab ? 'grid-cols-3' : 'grid-cols-2'
                  } gap-2 p-1 rounded-xl bg-black/40 border border-white/5`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setRole('buyer');
                      setError('');
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      role === 'buyer'
                        ? 'bg-sky-deep text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    id="page-buyer-portal-tab"
                  >
                    <User className="h-3.5 w-3.5" />
                    Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('producer');
                      setError('');
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      role === 'producer'
                        ? 'bg-gradient-to-r from-gold to-gold-dark text-black font-bold shadow-lg shadow-gold/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    id="page-producer-portal-tab"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Organiser
                  </button>
                  {showAdminTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setRole('admin');
                        setError('');
                      }}
                      className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                        role === 'admin'
                          ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold shadow-lg shadow-rose-950/50'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      id="page-admin-portal-tab"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Admin
                    </button>
                  )}
                </div>

                {success && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-400 animate-fadeIn">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                    {success}
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-medium text-red-400 animate-fadeIn">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    {error}
                  </div>
                )}

                {pendingVerificationEmail && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 space-y-2">
                    <p>
                      A verification email was dispatched to{' '}
                      <strong>{pendingVerificationEmail}</strong>. Please confirm your email address.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resending || resendCooldown > 0}
                      className="text-gold underline font-semibold hover:text-white disabled:opacity-50 cursor-pointer"
                    >
                      {resending
                        ? 'Sending verification link...'
                        : resendCooldown > 0
                        ? `Resend available in ${resendCooldown}s`
                        : 'Resend Verification Link'}
                    </button>
                  </div>
                )}

                {isRegister ? (
                  <SignUpForm
                    role={role}
                    name={name}
                    setName={setName}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    companyName={companyName}
                    setCompanyName={setCompanyName}
                    phoneNumber={phoneNumber}
                    setPhoneNumber={setPhoneNumber}
                    selectedBankCode={selectedBankCode}
                    setSelectedBankCode={setSelectedBankCode}
                    bankList={bankList}
                    isLoadingBanks={isLoadingBanks}
                    loading={loading}
                    onSubmit={handleSubmit}
                  />
                ) : (
                  <SignInForm
                    role={role}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    loading={loading}
                    onSubmit={handleSubmit}
                    onForgotPassword={() => {
                      setIsForgotPassword(true);
                      setError('');
                      setSuccess('');
                    }}
                  />
                )}

                <div className="text-center text-xs text-gray-400 pt-2 border-t border-white/5">
                  {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                  <button
                    onClick={toggleMode}
                    className={`font-semibold hover:underline bg-transparent border-none cursor-pointer ${
                      role === 'admin'
                        ? 'text-rose-500'
                        : role === 'producer'
                        ? 'text-gold'
                        : 'text-sky-light'
                    }`}
                    id="page-auth-switch-mode-btn"
                  >
                    {isRegister ? 'Log In Instead' : 'Create Account Now'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
