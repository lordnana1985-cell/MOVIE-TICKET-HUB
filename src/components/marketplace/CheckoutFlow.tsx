import React, { useState } from 'react';
import { UserProfile, MovieTicket, TicketPurchase } from '../../types';
import { db } from '../../lib/db';
import PaystackCheckout, { PaystackStep } from './PaystackCheckout';

export interface CartItem {
  ticket: MovieTicket;
  quantity: number;
}

interface CheckoutFlowProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  user: UserProfile | null;
  onPurchaseComplete: () => void;
  onClearCart: () => void;
}

export default function CheckoutFlow({
  isOpen,
  onClose,
  cart,
  user,
  onPurchaseComplete,
  onClearCart,
}: CheckoutFlowProps) {
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [pendingPaystackRef, setPendingPaystackRef] = useState<string | null>(null);
  const [paystackStep, setPaystackStep] = useState<PaystackStep>('details');
  const [paymentError, setPaymentError] = useState('');

  const cartTotal = cart.reduce((total, item) => total + item.ticket.price * item.quantity, 0);

  const handleClose = () => {
    setPaystackStep('details');
    setPendingPaystackRef(null);
    setPaymentError('');
    setIsInitializingPayment(false);
    onClose();
  };

  const handleConfirmPayment = async (customRef?: string) => {
    if (cart.length === 0 || !user) return;

    try {
      for (const item of cart) {
        for (let i = 0; i < item.quantity; i++) {
          const refId =
            customRef ||
            pendingPaystackRef ||
            `pstk_${Math.random().toString(36).substring(2, 15)}`;
          const priceVal = item.ticket.price;
          const producerEarning = priceVal * 0.8;
          const hubEarning = priceVal * 0.2;

          const newPurchase: TicketPurchase = {
            id: `tkt-pass-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
            ticketId: item.ticket.id,
            movieTitle: item.ticket.title,
            movieCoverUrl: item.ticket.coverUrl,
            buyerId: user.id,
            buyerName: user.name,
            buyerEmail: user.email,
            amountPaid: priceVal,
            producerEarning,
            hubEarning,
            paystackRef: refId,
            purchasedAt: new Date().toISOString(),
            status: 'unused',
          };

          await db.purchaseTicket(newPurchase);
        }
      }

      setPaystackStep('success');
      setTimeout(() => {
        handleClose();
        onClearCart();
        onPurchaseComplete();
      }, 2000);
    } catch (err: any) {
      setPaymentError(err.message || 'Payment processing failed. Please try again.');
    }
  };

  const handleVerifyPaystackPayment = async (customRef?: string) => {
    const referenceToVerify = customRef || pendingPaystackRef;
    if (!referenceToVerify) {
      await handleConfirmPayment();
      return;
    }

    setIsInitializingPayment(true);
    setPaymentError('');

    try {
      const res = await fetch(`/api/paystack/verify/${referenceToVerify}`);
      const contentType = res.headers.get('content-type');
      if (!res.ok || !contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Server returned error (${res.status}): ${text.slice(0, 100)}`);
      }
      const result = await res.json();

      if (result.status && result.data?.status === 'success') {
        await handleConfirmPayment(referenceToVerify);
      } else {
        setPaymentError(
          result.message ||
            'Payment verification failed. Please complete authorization in the gateway first.'
        );
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Error verifying payment.');
    } finally {
      setIsInitializingPayment(false);
    }
  };

  const handleProceedToPay = async () => {
    if (cart.length === 0 || !user) return;
    setIsInitializingPayment(true);
    setPaymentError('');

    try {
      const producerId = cart[0].ticket.producerId;
      const producerProfile = await db.getUserProfile(producerId);
      const subaccount_code = producerProfile?.paystackSubaccountCode;
      const totalCartPrice = cart.reduce((sum, item) => sum + item.ticket.price * item.quantity, 0);
      const callback_url = window.location.href;

      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          amount: totalCartPrice,
          subaccount_code: subaccount_code || null,
          callback_url,
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!res.ok || !contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Server returned error (${res.status}): ${text.slice(0, 100)}`);
      }

      const result = await res.json();

      if (result.status && result.data?.authorization_url) {
        setPendingPaystackRef(result.data.reference);
        setPaystackStep('otp');
        window.location.href = result.data.authorization_url;
      } else {
        setPaymentError(result.message || 'Failed to initialize Paystack transaction.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Network error.');
    } finally {
      setIsInitializingPayment(false);
    }
  };

  return (
    <PaystackCheckout
      isOpen={isOpen}
      onClose={handleClose}
      cart={cart}
      cartTotal={cartTotal}
      paystackStep={paystackStep}
      setPaystackStep={setPaystackStep}
      paymentError={paymentError}
      isInitializingPayment={isInitializingPayment}
      onProceedToPay={handleProceedToPay}
      onVerifyPayment={handleVerifyPaystackPayment}
    />
  );
}
