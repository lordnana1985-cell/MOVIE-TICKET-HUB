import { logger } from '../logger';
import { DbError } from './errors';
import { updateUserProfile } from './profiles';

export interface CreateSubaccountParams {
  businessName: string;
  settlementBank: string;
  accountNumber: string;
  primaryContactEmail: string;
}

export interface SubaccountResponse {
  success: boolean;
  subaccountCode?: string;
  message?: string;
  data?: any;
}

/**
 * Creates a Paystack settlement subaccount via the backend proxy (/api/paystack/subaccount)
 * and updates the producer's profile with the returned subaccount code.
 */
export async function createPaystackSubaccount(
  params: CreateSubaccountParams
): Promise<SubaccountResponse> {
  try {
    const res = await fetch('/api/paystack/subaccount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_name: params.businessName,
        settlement_bank: params.settlementBank,
        account_number: params.accountNumber,
        primary_contact_email: params.primaryContactEmail,
      }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const message =
        errorJson.message || `Failed to create subaccount with HTTP status ${res.status}`;
      logger.warn('Subaccount creation rejected by server', 'producerDb', {
        status: res.status,
        message,
      });
      return { success: false, message };
    }

    const result = await res.json();
    if (result.status && result.data?.subaccount_code) {
      return {
        success: true,
        subaccountCode: result.data.subaccount_code,
        message: result.message || 'Subaccount created successfully',
        data: result.data,
      };
    }

    return {
      success: false,
      message: result.message || 'Paystack subaccount generation failed.',
    };
  } catch (err: unknown) {
    const dbErr = DbError.fromError('createPaystackSubaccount', err);
    logger.error('Network failure during subaccount registration', 'producerDb', dbErr);
    return {
      success: false,
      message: dbErr.message || 'Network error while contacting subaccount endpoint.',
    };
  }
}

/**
 * Registers a producer's subaccount and commits the details to the database profile.
 */
export async function registerProducerSubaccount(
  userId: string,
  params: CreateSubaccountParams
): Promise<SubaccountResponse> {
  const result = await createPaystackSubaccount(params);
  if (result.success && result.subaccountCode) {
    try {
      await updateUserProfile(userId, {
        paystackSubaccountCode: result.subaccountCode,
        settlementBank: params.settlementBank,
        accountNumber: params.accountNumber,
        businessName: params.businessName,
      });
    } catch (err: unknown) {
      logger.error('Failed to commit subaccount code to user profile', 'producerDb', err);
    }
  }
  return result;
}
