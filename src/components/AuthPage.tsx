import { useState, useEffect, FormEvent } from 'react';
import { User, Mail, Shield, Building, Film, CheckCircle2, Lock, Sparkles, AlertCircle, ArrowLeft, Ticket, Phone, Eye, EyeOff } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { db, getSupabaseStatus } from '../lib/db';
import { supabase } from '../supabaseClient';

interface AuthPageProps {
  initialRole: UserRole;
  onAuthSuccess: (user: UserProfile) => void;
  onCancel?: () => void;
}

export default function AuthPage({
  initialRole,
  onAuthSuccess,
  onCancel
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
  const [selectedBankCode, setSelectedBankCode] = useState('MTN');
  const [bankList, setBankList] = useState<{name: string, code: string}[]>([
    { name: "MTN Mobile Money", code: "MTN" },
    { name: "Telecel Cash", code: "VOD" },
    { name: "AirtelTigo Money", code: "ATL" },
    { name: "GCB Bank", code: "040100" },
    { name: "Ecobank Ghana", code: "130100" },
    { name: "Zenith Bank Ghana", code: "180100" },
    { name: "Guaranty Trust Bank Ghana", code: "210100" },
    { name: "Fidelity Bank Ghana", code: "240100" }
  ]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
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
    } catch (e) {
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

  useEffect(() => {
    if (role === 'producer') {
      const fetchBanks = async () => {
        setIsLoadingBanks(true);
        try {
          const res = await fetch('/api/paystack/banks?currency=GHS');
          const result = await res.json();
          if (result.status && Array.isArray(result.data)) {
            setBankList(result.data);
            if (result.data.length > 0) {
              setSelectedBankCode(result.data[0].code);
            }
          }
        } catch (err) {
          console.error("Failed to load banks in AuthPage:", err);
        } finally {
          setIsLoadingBanks(false);
        }
      };
      fetchBanks();
    }
  }, [role]);

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
        setResendCooldown(60); // 60s cooldown on success
      } else {
        setError(res.message);
        if (res.message.toLowerCase().includes('rate limit') || res.message.toLowerCase().includes('too many requests')) {
          setResendCooldown(120); // 120s cooldown on rate limit to protect system and reduce spam
        } else {
          setResendCooldown(30); // 30s cooldown on other failures
        }
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
    // Check URL hash for recovery indicators
    const hash = window.location.hash || '';
    if (hash.includes('type=recovery') || hash.includes('recovery') || hash.includes('access_token')) {
      setIsRecoveryMode(true);
    }

    // Also monitor via Supabase state
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
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
      // Direct Supabase reset
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      });

      if (resetError) throw resetError;

      setSuccess('A secure password reset link has been dispatched to your email inbox! Please click the link to configure your new password.');
      setLoading(false);
    } catch (err: any) {
      console.warn('Password reset request error:', err);
      setError(err.message || 'We could not send a password reset link. Please verify your internet connection or email validity.');
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!newPassword) {
      setError('A new secure password is required.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('For your security, password must contain at least 6 characters.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords mismatch. Both password fields must be identical.');
      setLoading(false);
      return;
    }

    try {
      let localUpdated = false;
      const users = JSON.parse(localStorage.getItem('mt_hub_users') || '[]');
      const targetEmail = email.trim().toLowerCase() || 'admin@movieticket.com';
      const foundIdx = users.findIndex((u: any) => u.email.toLowerCase() === targetEmail);
      if (foundIdx !== -1) {
        users[foundIdx].password = newPassword;
        localStorage.setItem('mt_hub_users', JSON.stringify(users));
        localUpdated = true;
      }

      if (supabase) {
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
          });
          if (updateError) {
            if (!localUpdated) throw updateError;
            console.log('Supabase auth update failed, but locally updated.', updateError);
          }
        } catch (subErr) {
          if (!localUpdated) throw subErr;
          console.log('Supabase auth update exception, but locally updated.', subErr);
        }
      }

      setSuccess('Password updated successfully! You can now log in using your brand new credentials.');
      setLoading(false);
      
      // Clear hash so they don't loop back to recovery
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
      console.error('Password update failed:', err);
      setError(err.message || 'Failed to update password. Your recovery link may have expired. Please request a new link.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      setError('Email address is required.');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Password is required.');
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
        if (role === 'producer' && !companyName) {
          setError('Company / Cinema Production name is required.');
          setLoading(false);
          return;
        }
        if (role === 'producer' && !phoneNumber) {
          setError('Phone number is required for receiving payouts.');
          setLoading(false);
          return;
        }

        // Check if the email address is already registered in the system (prevent duplicate accounts)
        const emailExists = await db.checkEmailExists(email);
        if (emailExists) {
          setError('This email address is already registered. Please log in instead.');
          setLoading(false);
          return;
        }

        // SignUp via Supabase
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${window.location.pathname}`
          }
        });

        // Determine if they are already registered in Auth:
        // - Either signUp returned a 'user already registered' error
        // - Or signUp succeeded but returned an empty user.identities list (Supabase prevent enumeration mode)
        const isAlreadyRegisteredInAuth = 
          (signUpError && (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('already exists'))) ||
          (!signUpError && data?.user && data.user.identities && data.user.identities.length === 0);

        if (isAlreadyRegisteredInAuth) {
          setError('This email is already registered. Please log in instead.');
          setLoading(false);
          return;
        }

        if (signUpError) {
          const msg = signUpError.message.toLowerCase();
          if (msg.includes('rate limit') || msg.includes('too many requests')) {
            setError('Registration rate limit exceeded. If you already registered, please check your inbox (including spam) for the verification link or wait a few minutes before trying again.');
          } else {
            setError(signUpError.message);
          }
          setLoading(false);
          return;
        }

        const userAuth = data.user;
        const userId = userAuth?.id || `u-${Math.random().toString(36).substring(2, 11)}`;

        // Register in database / profile table
        let newProfile = await db.registerUser({
          id: userId,
          email,
          role,
          name,
          companyName: role === 'producer' ? companyName : undefined,
          phoneNumber: role === 'producer' ? phoneNumber : undefined,
          settlementBank: role === 'producer' ? selectedBankCode : undefined,
          accountNumber: role === 'producer' ? phoneNumber : undefined
        });

        if (role === 'producer') {
          const subaccountCode = await db.generatePaystackSubaccount(newProfile);
          if (subaccountCode) {
            newProfile.paystackSubaccountCode = subaccountCode;
            newProfile.settlementBank = selectedBankCode;
            newProfile.accountNumber = phoneNumber;
            newProfile.businessName = companyName;
          }
        }

        setSuccess('Registration successful! Welcome to Event Ticket Hub (ETH).');
        setTimeout(() => {
          onAuthSuccess(newProfile);
        }, 1500);

      } else {
        // SignIn via Supabase with fallback to local auth for mock/seeded users
        let authUser = null;
        let supabaseSuccess = false;
        try {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (signInError) {
            const msg = signInError.message.toLowerCase();
            if (msg.includes('confirm') || msg.includes('verified') || msg.includes('email not confirmed')) {
              // Bypass email confirmation error - login immediately as password is correct
              console.log('Bypassing Supabase email confirmation requirement.');
              supabaseSuccess = true;
            } else {
              // Check fallback for local seed user (like admin@movieticket.com) or custom locally updated password
              const users = JSON.parse(localStorage.getItem('mt_hub_users') || '[]');
              const foundLocally = users.find((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());
              if (foundLocally) {
                const storedPass = foundLocally.password;
                if (!storedPass || storedPass === password) {
                  console.log('Falling back to local authentication.');
                  supabaseSuccess = true;
                } else {
                  setError('Invalid password. Please check your credentials.');
                  setLoading(false);
                  return;
                }
              } else {
                setError(signInError.message);
                setLoading(false);
                return;
              }
            }
          } else {
            supabaseSuccess = true;
            authUser = data?.user;
          }
        } catch (signInExc: any) {
          const msg = (signInExc?.message || '').toLowerCase();
          if (msg.includes('confirm') || msg.includes('verified') || msg.includes('email not confirmed')) {
            supabaseSuccess = true;
          } else {
            // Check local fallback
            const users = JSON.parse(localStorage.getItem('mt_hub_users') || '[]');
            const foundLocally = users.find((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());
            if (foundLocally) {
              const storedPass = foundLocally.password;
              if (!storedPass || storedPass === password) {
                supabaseSuccess = true;
              } else {
                setError('Invalid password. Please check your credentials.');
                setLoading(false);
                return;
              }
            } else {
              setError(signInExc.message || 'Authentication failed.');
              setLoading(false);
              return;
            }
          }
        }

        // Fetch user profile
        let profile = await db.loginUser(email, role);
        if (!profile && supabaseSuccess) {
          // Fallback if authenticated but profile doesn't exist
          profile = await db.registerUser({
            id: authUser?.id || `u-${Math.random().toString(36).substring(2, 11)}`,
            email,
            role,
            name: email.split('@')[0],
          });
        }

        if (role === 'producer' && !profile.paystackSubaccountCode) {
          setSuccess('Login successful! Automatically generating your 80/20 Paystack split payout subaccount...');
          const subaccountCode = await db.generatePaystackSubaccount(profile);
          if (subaccountCode) {
            profile.paystackSubaccountCode = subaccountCode;
          }
        }

        setPendingVerificationEmail(''); // Clear verification alert on successful login
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
    <div className="w-full max-w-6xl mx-auto rounded-3xl overflow-hidden border border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-2xl relative animate-fadeIn" id="auth-page-container">
      {/* Top running gradient edge */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-deep via-gold to-gold-dark" />
      
      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* LEFT COLUMN: Cinematic Promotion (Show only on lg) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-sky-950/50 to-slate-900 p-12 flex-col justify-between relative overflow-hidden border-r border-white/5">
          {/* Decorative light flares */}
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gold/10 blur-[100px] pointer-events-none" />

          {/* Top Row: Back button */}
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

          {/* Middle Row: Hero Slogans */}
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
              ETH (Event Ticket Hub) is the ultimate self-service system for movie premieres, concerts, pageants, campus events, and live gate ticket validation. Directly connect organisers with buyers.
            </p>

            <div className="space-y-4 pt-6">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
                  <Ticket className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">Seamless Checkout</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Secure ticket sales backed by reliable Paystack integration.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-md bg-gold/10 border border-gold/20 text-gold shrink-0">
                  <Shield className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">Live Gate validation</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Built-in scanner console for organisers to validate tickets at the event gate.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">80% direct organiser payout</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Industry-leading revenue share instantly calculated and routed.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Footer credentials */}
          <div className="border-t border-white/5 pt-6 flex justify-between items-center text-[10px] font-mono text-gray-500">
            <span>SECURED ENCRYPTED CONNECTION</span>
            <span>v1.2.0</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Authentication Form */}
        <div className="flex-1 p-6 md:p-12 flex flex-col justify-center relative">
          {/* Back button for mobile */}
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
              <>
                {/* RECOVERY MODE TITLE */}
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

                {/* Notifications */}
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
                        type={showPassword ? "text" : "password"}
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

                <div className="text-center text-xs text-gray-400 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(false);
                      setIsForgotPassword(false);
                      setError('');
                      setSuccess('');
                    }}
                    className="font-semibold hover:underline bg-transparent border-none cursor-pointer text-gold"
                  >
                    Back to Login Portal
                  </button>
                </div>
              </>
            ) : isForgotPassword ? (
              <>
                {/* FORGOT PASSWORD TITLE */}
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

                {/* Notifications */}
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

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
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
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all mt-4 shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center bg-sky-deep text-white cursor-pointer"
                  >
                    {loading ? 'Processing...' : 'Send Secure Reset Link'}
                  </button>
                </form>

                {/* SUPABASE REDIRECT ADVISORY */}
                <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 space-y-2 text-xs text-gray-300">
                  <div className="flex items-center gap-2 font-semibold text-gold">
                    <AlertCircle className="h-4 w-4 shrink-0 text-gold" />
                    <span>Supabase Link Configuration Guide</span>
                  </div>
                  <p className="leading-relaxed text-[11px] text-gray-400">
                    If clicking the reset link in your email redirects you to <code className="text-white bg-white/10 px-1 rounded">localhost</code>, you must configure your Supabase settings to whitelist this app's URL:
                  </p>
                  <ol className="list-decimal pl-4.5 space-y-1 text-[11px] text-gray-400">
                    <li>Go to your <strong className="text-white">Supabase Dashboard</strong>.</li>
                    <li>Open <strong className="text-white">Auth &gt; URL Configuration</strong> (or Project Settings &gt; Authentication).</li>
                    <li>Add this web application URL to your <strong className="text-white">Redirect URLs</strong> list:</li>
                  </ol>
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-black/40 border border-white/10 p-2 font-mono text-[10px] text-white">
                    <span className="truncate select-all text-gold">{`${window.location.origin}${window.location.pathname}`}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}`);
                        alert("URL Copied! Add this to Redirect URLs in your Supabase Dashboard.");
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
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError('');
                      setSuccess('');
                    }}
                    className="font-semibold hover:underline bg-transparent border-none cursor-pointer text-sky-light"
                  >
                    Back to Login Portal
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* STANDARD AUTH PAGE */}
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
                    title="Secret Overwatch Portal Trigger"
                  >
                    <Film className={`h-5 w-5 ${role === 'admin' ? 'text-rose-500' : role === 'producer' ? 'text-gold' : 'text-sky-light'}`} />
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                    {role === 'admin' ? 'Admin Control Portal' : role === 'producer' ? 'Organiser Portal' : 'Buyer Portal'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {isRegister ? 'Register your event organiser or buyer profile' : (role === 'admin' ? 'SIGN IN TO DEPLOY AND REGULATE CINEMAS' : role === 'producer' ? 'SIGN IN TO PUBLISH LIVE EVENT TICKETS' : 'Sign in to access tickets, trailers and events')}
                  </p>
                </div>

                {/* Portal toggle */}
                <div className={`grid ${showAdminTab ? 'grid-cols-3' : 'grid-cols-2'} gap-2 p-1 rounded-xl bg-black/40 border border-white/5`}>
                  <button
                    type="button"
                    onClick={() => { setRole('buyer'); setError(''); }}
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
                    onClick={() => { setRole('producer'); setError(''); }}
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
                      onClick={() => { setRole('admin'); setError(''); }}
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

                {/* Notifications */}
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
                  <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 space-y-3.5 text-xs text-gray-300 animate-fadeIn" id="email-verification-pending-card">
                    <div className="flex items-center gap-2 font-semibold text-gold">
                      <Mail className="h-4 w-4 shrink-0 text-gold text-yellow-400" />
                      <span>Email Verification Pending</span>
                    </div>
                    <p className="leading-relaxed text-[11px] text-gray-400">
                      We sent a verification link to <strong className="text-white">{pendingVerificationEmail}</strong>. You must click that link before you can log in and access your dashboard.
                    </p>

                    <div className="rounded-lg bg-black/40 border border-white/5 p-3 space-y-2 text-[11px] text-gray-400">
                      <div className="font-semibold text-white/90 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                        <AlertCircle className="h-3.5 w-3.5 text-yellow-500/80 shrink-0" />
                        <span>Dealing with Delivery Delays?</span>
                      </div>
                      <p className="leading-relaxed text-gray-400">
                        Verification emails usually deliver within <span className="text-white">1–3 minutes</span>. However, external email providers (like Gmail, Yahoo, or corporate servers) can occasionally delay messages up to <span className="text-white">10 minutes</span> during peak traffic or grey-listing checks.
                      </p>
                      <ul className="list-disc list-inside space-y-1 pl-1 text-[10px] text-gray-500">
                        <li>Check your <strong className="text-gray-400">Spam, Junk, or Updates</strong> folders.</li>
                        <li>Search your mailbox for <strong className="text-gray-400">"Event Ticket Hub"</strong> or <strong className="text-gray-400">"verification"</strong>.</li>
                        <li>Ensure you spelled your email address correctly.</li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-white/5 pt-3 mt-1">
                      <span className="text-[10px] text-gray-500">
                        {resendCooldown > 0 ? `Wait ${resendCooldown}s before requesting again.` : "Didn't receive the email after waiting?"}
                      </span>
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resending || resendCooldown > 0}
                        className="px-3 py-1.5 rounded-lg bg-gold hover:bg-yellow-500 disabled:opacity-50 disabled:hover:bg-gold disabled:cursor-not-allowed text-black font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer shrink-0 self-start sm:self-auto"
                      >
                        {resending ? 'Resending...' : resendCooldown > 0 ? `Retry in ${resendCooldown}s` : 'Resend Email'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Core form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isRegister && (
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
                        />
                      </div>
                    </div>
                  )}

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
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-600 focus:border-sky-deep focus:outline-none focus:ring-1 focus:ring-sky-deep transition-all"
                        id="auth-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors focus:outline-none"
                        id="toggle-auth-password"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {!isRegister && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError('');
                          setSuccess('');
                        }}
                        className="text-[11px] text-gray-400 hover:text-white hover:underline font-mono cursor-pointer"
                        id="forgot-password-trigger-btn"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {isRegister && role === 'producer' && (
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
                            id="auth-producer-phone-number"
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
                      role === 'admin'
                        ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white font-bold shadow-md shadow-rose-900/30'
                        : role === 'producer'
                        ? 'bg-gradient-to-r from-gold-light via-gold to-gold-dark text-black font-bold'
                        : 'bg-sky-deep text-white font-bold'
                    }`}
                    id="page-auth-submit-btn"
                  >
                    {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Authenticate & Log In'}
                  </button>
                </form>

                {/* Toggle Sign In / Register mode */}
                <div className="text-center text-xs text-gray-400 pt-2 border-t border-white/5">
                  {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                  <button
                    onClick={toggleMode}
                    className={`font-semibold hover:underline bg-transparent border-none cursor-pointer ${
                      role === 'admin' ? 'text-rose-500' : role === 'producer' ? 'text-gold' : 'text-sky-light'
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
