import { useState, useEffect, FormEvent, useCallback } from 'react';
import { UserProfile, UserRole } from '../types';
import { db, supabase, isSupabaseConfigured } from '../lib/db';
import { logger } from '../lib/logger';

interface UseAuthFormOptions {
  initialRole: UserRole;
  onAuthSuccess: (user: UserProfile) => void;
  selectedBankCode?: string;
}

export function useAuthForm({ initialRole, onAuthSuccess, selectedBankCode }: UseAuthFormOptions) {
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

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

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
    const hash = window.location.hash || '';
    if (
      hash.includes('type=recovery') ||
      hash.includes('recovery') ||
      hash.includes('access_token')
    ) {
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

  const handleResendVerification = useCallback(async () => {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend verification link.';
      setError(message);
      setResendCooldown(30);
    } finally {
      setResending(false);
    }
  }, [resendCooldown, pendingVerificationEmail, email]);

  const handleForgotPasswordSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      setLoading(true);

      if (!email) {
        setError('Please provide your registered email address.');
        setLoading(false);
        return;
      }

      if (isSupabaseConfigured && supabase) {
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
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Could not send password reset link.';
          logger.warn('Password reset request error', 'AuthPage', {
            error: message,
          });
          setError(message);
          setLoading(false);
        }
      } else {
        setSuccess('Password reset link sent (Simulation mode: check your email).');
        setLoading(false);
      }
    },
    [email]
  );

  const handleRecoverySubmit = useCallback(
    async (e: FormEvent) => {
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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update password.';
        setError(message);
        setLoading(false);
      }
    },
    [newPassword, confirmPassword]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
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
          if (isSupabaseConfigured && supabase) {
            try {
              const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
                },
              });
              if (!signUpError) userAuth = data?.user;
            } catch (signUpExc: unknown) {
              const msg = signUpExc instanceof Error ? signUpExc.message : String(signUpExc);
              logger.warn('Supabase signUp note', 'AuthPage', {
                error: msg,
              });
            }
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
          if (isSupabaseConfigured && supabase) {
            try {
              const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              if (signInError) {
                const users = JSON.parse(localStorage.getItem('mt_hub_users') || '[]');
                const foundLocally = users.find(
                  (u: { email: string; password?: string }) =>
                    u.email.toLowerCase() === email.trim().toLowerCase()
                );
                if (
                  !foundLocally ||
                  (foundLocally.password && foundLocally.password !== password)
                ) {
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

          setSuccess(`Welcome back, ${profile.name || profile.email}!`);
          setTimeout(() => {
            onAuthSuccess(profile!);
          }, 800);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Authentication failed.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [
      email,
      password,
      isRegister,
      name,
      role,
      companyName,
      phoneNumber,
      selectedBankCode,
      onAuthSuccess,
    ]
  );

  return {
    role,
    setRole,
    isRegister,
    setIsRegister,
    isForgotPassword,
    setIsForgotPassword,
    isRecoveryMode,
    setIsRecoveryMode,
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
    setLoading,
    pendingVerificationEmail,
    setPendingVerificationEmail,
    resending,
    resendCooldown,
    handleResendVerification,
    handleForgotPasswordSubmit,
    handleRecoverySubmit,
    handleSubmit,
  };
}
