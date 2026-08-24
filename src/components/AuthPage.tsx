import React, { useState, useEffect, FormEvent } from 'react';
import { User, Shield, Film, CheckCircle2, Lock, Sparkles, AlertCircle, ArrowLeft, Ticket, Eye, EyeOff } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { db, supabase } from '../lib/db';
import { logger } from '../lib/logger';
import { useBankList } from '../hooks/useBankList';
import SignInForm from './auth/SignInForm';
import SignUpForm from './auth/SignUpForm';
import ForgotPasswordForm from './auth/ForgotPasswordForm';

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
  const [role, setRole] = useState<UserRole>(initialRole);
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const {
    bankList,
    isLoading: isLoadingBanks,
    selectedBankCode,
    setSelectedBankCode,
  } = useBankList({
    currency: 'GHS',
    enabled: role === 'producer',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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
  }, [showAdminTab, role]);

  useEffect(() => {
    if (role === 'admin') {
      setEmail('admin@movieticket.com');
    }
  }, [role]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    const emailToUse = pendingVerificationEmail || email;
    if (!emailToUse) {
      setError('Please provide your email address to resend the verification link.');
      return;
    }

    setResending(true);
    setError('');
    setSuccess('');
    try {
      const res = await db.resendVerificationEmail(emailToUse);
      if (res.success) {
        setSuccess(res.message);
        setResendCooldown(60);
      } else {
        setError(res.message);
        setResendCooldown(30);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification link.');
      setResendCooldown(30);
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  useEffect(() => {
    const hash = window.location.hash || '';
    if (hash.includes('type=recovery') || hash.includes('recovery') || hash.includes('access_token')) {
      setIsRecoveryMode(true);
    }

    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoveryMode(true);
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleForgotPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      setError('Please provide your registered email address.');
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
        }
      );
      if (resetError) throw resetError;
      setSuccess('A secure password reset link has been dispatched to your email inbox!');
      setLoading(false);
    } catch (err: any) {
      logger.warn('Password reset request error', 'AuthPage', { error: err?.message || err });
      setError(err.message || 'Could not send password reset link.');
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!newPassword || newPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords mismatch. Both password fields must be identical.');
      setLoading(false);
      return;
    }

    try {
      if (supabase) {
        await supabase.auth.updateUser({ password: newPassword });
      }
      setSuccess('Password updated successfully! You can now log in.');
      setLoading(false);
      window.location.hash = '';
      setTimeout(() => {
        setIsRecoveryMode(false);
        setIsForgotPassword(false);
        setIsRegister(false);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password) {
      setError('Email and password are required.');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        if (!name) {
          setError('Full name is required.');
          setLoading(false);
          return;
        }
        if (role === 'producer' && (!companyName || !phoneNumber)) {
          setError('Company name and phone number are required for organisers.');
          setLoading(false);
          return;
        }

        const emailExists = await db.checkEmailExists(email);
        if (emailExists) {
          setError('This email address is already registered. Please log in instead.');
          setLoading(false);
          return;
        }

        let userAuth = null;
        try {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
            },
          });
          if (!signUpError) userAuth = data?.user;
        } catch (signUpExc: any) {
          logger.warn('Supabase signUp note', 'AuthPage', { error: signUpExc?.message || signUpExc });
        }

        const userId = userAuth?.id || `u-${Math.random().toString(36).substring(2, 11)}`;
        const newProfile = await db.registerUser({
          id: userId,
          email,
          role,
          name,
          companyName: role === 'producer' ? companyName : undefined,
          phoneNumber: role === 'producer' ? phoneNumber : undefined,
          settlementBank: role === 'producer' ? selectedBankCode : undefined,
          accountNumber: role === 'producer' ? phoneNumber : undefined,
        });

        if (role === 'producer') {
          const subaccountCode = await db.generatePaystackSubaccount(newProfile);
          if (subaccountCode) {
            newProfile.paystackSubaccountCode = subaccountCode;
          }
        }

        setSuccess('Registration successful! Welcome to Event Ticket Hub (ETH).');
        setTimeout(() => {
          onAuthSuccess(newProfile);
        }, 1500);
      } else {
        let authUser = null;
        try {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) {
            const users = JSON.parse(localStorage.getItem('mt_hub_users') || '[]');
            const foundLocally = users.find((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());
            if (!foundLocally || (foundLocally.password && foundLocally.password !== password)) {
              setError(signInError.message);
              setLoading(false);
              return;
            }
          } else {
            authUser = data?.user;
          }
        } catch {
          // fallback
        }

        let profile = await db.loginUser(email, role);
        if (!profile) {
          profile = await db.registerUser({
            id: authUser?.id || `u-${Math.random().toString(36).substring(2, 11)}`,
            email,
            role,
            name: email.split('@')[0],
          });
        }

        if (role === 'producer' && !profile.paystackSubaccountCode) {
          const subaccountCode = await db.generatePaystackSubaccount(profile);
          if (subaccountCode) {
            profile.paystackSubaccountCode = subaccountCode;
          }
        }

        setSuccess('Login successful! Welcome back.');
        setTimeout(() => {
          onAuthSuccess(profile);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

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
        {/* Left Column */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-sky-950/50 to-slate-900 p-12 flex-col justify-between relative overflow-hidden border-r border-white/5">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gold/10 blur-[100px] pointer-events-none" />

          {onCancel && (
            <div>
              <button
                onClick={onCancel}
                className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-400 hover:text-white transition-colors uppercase font-mono"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Marketplace
              </button>
            </div>
          )}

          <div className="space-y-6 my-auto relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 border border-gold/20 px-3 py-1 text-[10px] font-bold text-gold tracking-widest font-mono uppercase">
              <Sparkles className="h-3 w-3 text-gold animate-pulse" />
              LIVE EVENT TICKET HUB
            </div>

            <h1 className="font-display text-4xl font-extrabold tracking-tight text-white leading-tight">
              Empowering Organizers. <br />
              <span className="text-gold">Delighting Event Goers.</span>
            </h1>

            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              ETH (Event Ticket Hub) is the ultimate self-service system for movie premieres, concerts,
              pageants, campus events, and live gate ticket validation.
            </p>

            <div className="space-y-4 pt-6">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
                  <Ticket className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">
                    Seamless Checkout
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Secure ticket sales backed by reliable Paystack integration.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-md bg-gold/10 border border-gold/20 text-gold shrink-0">
                  <Shield className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">
                    Live Gate Validation
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Built-in scanner console for organisers to validate tickets at the event gate.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">
                    80% Direct Organiser Payout
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Industry-leading revenue share instantly calculated and routed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex justify-between items-center text-[10px] font-mono text-gray-500">
            <span>SECURED ENCRYPTED CONNECTION</span>
            <span>v1.2.0</span>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 p-6 md:p-12 flex flex-col justify-center relative">
          {onCancel && (
            <div className="lg:hidden mb-6">
              <button
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-gray-400 hover:text-white transition-colors uppercase font-mono"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Marketplace
              </button>
            </div>
          )}

          <div className="w-full max-w-md mx-auto space-y-6">
            {isRecoveryMode ? (
              <div className="space-y-6">
                <div className="text-center lg:text-left">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-black to-white/10 border border-white/10 mb-4">
                    <Lock className="h-5 w-5 text-gold" />
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                    Set New Password
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Please configure a secure password for your account.
                  </p>
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

                <form onSubmit={handleRecoverySubmit} className="space-y-4">
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
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors focus:outline-none"
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
                    className="w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all mt-4 shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center bg-gradient-to-r from-gold-light via-gold to-gold-dark text-black cursor-pointer"
                  >
                    {loading ? 'Processing...' : 'Update My Password'}
                  </button>
                </form>
              </div>
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
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all ${
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
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all ${
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
                      className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all ${
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
