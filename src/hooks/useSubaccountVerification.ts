import { useState, useEffect, useCallback } from 'react';
import { logger } from '../lib/logger';

export interface UseSubaccountVerificationOptions {
  cooldownSeconds?: number;
}

export function useSubaccountVerification(options: UseSubaccountVerificationOptions = {}) {
  const defaultCooldown = options.cooldownSeconds ?? 60;

  const [generatedCode, setGeneratedCode] = useState('');
  const [userEnteredCode, setUserEnteredCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const dispatchCodeEmail = useCallback(async (email: string, code: string, purpose: string) => {
    try {
      await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          purpose,
        }),
      });
    } catch (err) {
      logger.error('Failed to dispatch verification code email', 'useSubaccountVerification', err);
    }
  }, []);

  const initiateVerification = useCallback(
    async (email: string, purpose = 'payout_account_change') => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedCode(code);
      setShowVerificationInput(true);
      setVerificationError('');
      setResendCooldown(defaultCooldown);
      await dispatchCodeEmail(email, code, purpose);
      return code;
    },
    [defaultCooldown, dispatchCodeEmail]
  );

  const resendVerificationCode = useCallback(
    async (email: string, purpose = 'payout_account_change_resend') => {
      if (resendCooldown > 0) return null;
      const newCode = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedCode(newCode);
      setUserEnteredCode('');
      setVerificationError('');
      setResendCooldown(defaultCooldown);
      await dispatchCodeEmail(email, newCode, purpose);
      return newCode;
    },
    [defaultCooldown, resendCooldown, dispatchCodeEmail]
  );

  const verifyEnteredCode = useCallback(() => {
    if (!showVerificationInput) return true;
    if (userEnteredCode !== generatedCode) {
      setVerificationError(
        'Invalid 4-digit verification code. Please confirm the code sent to your email.'
      );
      return false;
    }
    setShowVerificationInput(false);
    setGeneratedCode('');
    setUserEnteredCode('');
    setVerificationError('');
    return true;
  }, [showVerificationInput, userEnteredCode, generatedCode]);

  const resetVerification = useCallback(() => {
    setGeneratedCode('');
    setUserEnteredCode('');
    setShowVerificationInput(false);
    setVerificationError('');
    setResendCooldown(0);
  }, []);

  return {
    generatedCode,
    userEnteredCode,
    showVerificationInput,
    verificationError,
    resendCooldown,
    setGeneratedCode,
    setUserEnteredCode,
    setShowVerificationInput,
    setVerificationError,
    setResendCooldown,
    initiateVerification,
    resendVerificationCode,
    verifyEnteredCode,
    resetVerification,
  };
}
