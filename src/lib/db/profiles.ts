import { UserProfile, UserRole, MovieTicket, TicketPurchase } from '../../types';
import {
  supabase,
  isSupabaseConfigured,
  setSupabaseLastError,
  getLocalData,
  setLocalData,
  addDeletedTicketId,
  notifyTicketsChanged,
} from './client';
import { deleteTicket } from './tickets';
import { logger } from '../logger';
import { DbError } from './errors';
import {
  supabaseCheckEmailExists,
  supabaseCheckEmailOppositeRole,
  supabaseInsertProfile,
  supabaseLoginProfile,
  supabaseGetProfile,
  supabaseUpdateProfile,
  supabaseGetAllProfiles,
  supabaseDeleteProfile,
} from './profiles.supabase';

export async function checkEmailExists(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const remoteExists = await supabaseCheckEmailExists(cleanEmail);
    if (remoteExists === true) return true;
  } catch (e: unknown) {
    const dbErr = DbError.fromError('checkEmailExists', e, true);
    logger.warn('Supabase email exists check failed, falling back to LocalStorage', 'profiles', {
      error: dbErr.message,
    });
  }

  const users = getLocalData<UserProfile[]>('users', []);
  return users.some((u) => u.email.toLowerCase() === cleanEmail);
}

export async function checkEmailOppositeRole(
  email: string,
  role: UserRole
): Promise<string | null> {
  const otherRole: UserRole = role === 'producer' ? 'buyer' : 'producer';
  try {
    const remoteOpposite = await supabaseCheckEmailOppositeRole(email, role);
    if (remoteOpposite) return remoteOpposite;
  } catch (e: unknown) {
    const dbErr = DbError.fromError('checkEmailOppositeRole', e, true);
    logger.warn('Supabase opposite role check failed, falling back to LocalStorage', 'profiles', {
      error: dbErr.message,
    });
  }

  const users = getLocalData<UserProfile[]>('users', []);
  const foundOther = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.role === otherRole
  );
  return foundOther ? otherRole : null;
}

export async function registerUser(profile: Omit<UserProfile, 'balance'>): Promise<UserProfile> {
  const fullProfile: UserProfile = { ...profile, balance: 0 };

  try {
    await supabaseInsertProfile(fullProfile);
  } catch (e: unknown) {
    const dbErr = DbError.fromError('registerUser', e, true);
    setSupabaseLastError(dbErr.message);
    logger.error('Supabase registration write failed, falling back to LocalStorage', 'profiles', {
      error: dbErr.message,
    });
  }

  const users = getLocalData<UserProfile[]>('users', []);
  const filteredUsers = users.filter(
    (u) =>
      u.id !== fullProfile.id &&
      !(u.email.toLowerCase() === fullProfile.email.toLowerCase() && u.role === fullProfile.role)
  );
  filteredUsers.push(fullProfile);
  setLocalData('users', filteredUsers);
  return fullProfile;
}

export async function loginUser(email: string, role: UserRole): Promise<UserProfile | null> {
  try {
    const remoteUser = await supabaseLoginProfile(email, role);
    if (remoteUser) return remoteUser;
  } catch (e: unknown) {
    const dbErr = DbError.fromError('loginUser', e, true);
    setSupabaseLastError(dbErr.message);
    logger.warn('Supabase login failed, falling back to LocalStorage', 'profiles', {
      error: dbErr.message,
    });
  }

  const users = getLocalData<UserProfile[]>('users', []);
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (found) {
    if (found.role === 'admin') return found;
    if (role === 'admin') return null;
    if (found.role !== role) {
      found.role = role;
      setLocalData('users', users);
    }
    return found;
  }
  return null;
}

export async function getUserProfile(id: string): Promise<UserProfile | null> {
  try {
    const remoteProfile = await supabaseGetProfile(id);
    if (remoteProfile) return remoteProfile;
  } catch (e: unknown) {
    const dbErr = DbError.fromError('getUserProfile', e, true);
    setSupabaseLastError(dbErr.message);
    logger.warn('Supabase profile fetch failed, falling back to LocalStorage', 'profiles', {
      error: dbErr.message,
    });
  }

  const users = getLocalData<UserProfile[]>('users', []);
  return users.find((u) => u.id === id) || null;
}

export async function updateUserProfile(
  id: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  try {
    await supabaseUpdateProfile(id, updates);
  } catch (e: unknown) {
    const dbErr = DbError.fromError('updateUserProfile', e, true);
    logger.warn('Supabase profile update failed, updating LocalStorage fallback', 'profiles', {
      error: dbErr.message,
    });
  }

  const users = getLocalData<UserProfile[]>('users', []);
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    setLocalData('users', users);
    return users[idx];
  }

  const current = await getUserProfile(id);
  if (current) {
    const updated = { ...current, ...updates };
    const filteredUsers = users.filter((u) => u.id !== id);
    filteredUsers.push(updated);
    setLocalData('users', filteredUsers);
    return updated;
  }

  return null;
}

export async function generatePaystackSubaccount(
  userOrId: UserProfile | string
): Promise<string | null> {
  const user = typeof userOrId === 'string' ? await getUserProfile(userOrId) : userOrId;
  if (!user) return null;
  if (user.paystackSubaccountCode) return user.paystackSubaccountCode;

  try {
    const businessName = user.companyName || user.name || `Producer ${user.id}`;
    const settlementBank = user.settlementBank || 'MTN';
    let accountNumber = user.phoneNumber || '';
    accountNumber = accountNumber.replace(/\D/g, '');
    if (accountNumber.length < 10) {
      accountNumber = '0' + Math.floor(200000000 + Math.random() * 800000000).toString();
    }

    let subaccountCode: string | null = null;
    try {
      const res = await fetch('/api/paystack/subaccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          settlement_bank: settlementBank,
          account_number: accountNumber,
          primary_contact_email: user.email,
        }),
      });

      if (res && res.ok) {
        const result = await res.json();
        if (result.status && result.data?.subaccount_code) {
          subaccountCode = result.data.subaccount_code;
        }
      }
    } catch {
      // offline / test environment fallback
    }

    if (!subaccountCode) {
      subaccountCode = `SUB_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    }

    await updateUserProfile(user.id, {
      paystackSubaccountCode: subaccountCode,
      settlementBank: settlementBank,
      accountNumber: accountNumber,
      businessName: businessName,
    });
    return subaccountCode;
  } catch (err: unknown) {
    const dbErr = DbError.fromError('generatePaystackSubaccount', err);
    logger.error('Error generating subaccount', 'profiles', dbErr);
  }
  return null;
}

export async function checkUserEmailConfirmed(): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) return !!user.email_confirmed_at;
    } catch (e: unknown) {
      logger.warn('Error checking user email confirmation status', 'profiles', { error: e });
    }
  }
  return true;
}

export async function resendVerificationEmail(
  email: string
): Promise<{ success: boolean; message: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
        },
      });
      if (error) throw error;
      return {
        success: true,
        message: 'Verification link resent successfully! Please check your inbox and spam folder.',
      };
    } catch (e: unknown) {
      const dbErr = DbError.fromError('resendVerificationEmail', e);
      logger.error('Error resending verification email', 'profiles', dbErr);
      const errMsg = e instanceof Error ? e.message : String(e);
      return { success: false, message: errMsg || 'Failed to resend verification email.' };
    }
  }
  return { success: true, message: 'Simulation mode: verification email resent successfully!' };
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  let supabaseProfiles: UserProfile[] = [];
  try {
    supabaseProfiles = await supabaseGetAllProfiles();
  } catch (e: unknown) {
    const dbErr = DbError.fromError('getAllProfiles', e, true);
    logger.warn('Supabase getAllProfiles failed, falling back to LocalStorage', 'profiles', {
      error: dbErr.message,
    });
  }

  const localUsers = getLocalData<UserProfile[]>('users', []);
  const uniqueLocalUsers: UserProfile[] = [];
  const seenUserIds = new Set<string>();
  for (const u of localUsers) {
    if (u && u.id && !seenUserIds.has(u.id)) {
      seenUserIds.add(u.id);
      uniqueLocalUsers.push(u);
    }
  }

  if (supabaseProfiles.length > 0) {
    const merged = [...supabaseProfiles];
    for (const lu of uniqueLocalUsers) {
      if (!merged.some((u) => u.id === lu.id)) merged.push(lu);
    }
    return merged;
  }

  return uniqueLocalUsers;
}

export async function deleteProfile(id: string): Promise<boolean> {
  try {
    await supabaseDeleteProfile(id);
  } catch (e: unknown) {
    const dbErr = DbError.fromError('deleteProfile', e, true);
    setSupabaseLastError(dbErr.message);
    logger.warn('Supabase deleteProfile failed, falling back to LocalStorage', 'profiles', {
      error: dbErr.message,
    });
  }

  const users = getLocalData<UserProfile[]>('users', []);
  setLocalData(
    'users',
    users.filter((u) => u.id !== id)
  );

  const tickets = getLocalData<MovieTicket[]>('tickets', []);
  const producerTickets = tickets.filter((t) => t.producerId === id);
  producerTickets.forEach((t) => {
    addDeletedTicketId(t.id);
    deleteTicket(t.id, true);
  });
  setLocalData(
    'tickets',
    tickets.filter((t) => t.producerId !== id)
  );

  const purchases = getLocalData<TicketPurchase[]>('purchases', []);
  setLocalData(
    'purchases',
    purchases.filter(
      (p) => p.buyerId !== id && !tickets.some((t) => t.id === p.ticketId && t.producerId === id)
    )
  );

  notifyTicketsChanged();
  return true;
}
