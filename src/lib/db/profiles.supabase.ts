import { UserProfile, UserRole } from '../../types';
import { supabase, isSupabaseConfigured } from './client';

export async function supabaseCheckEmailExists(email: string): Promise<boolean | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.from('profiles').select('id').eq('email', cleanEmail);
  if (error && error.code !== 'PGRST116') throw error;
  return data && data.length > 0 ? true : false;
}

export async function supabaseCheckEmailOppositeRole(
  email: string,
  role: UserRole
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const otherRole: UserRole = role === 'producer' ? 'buyer' : 'producer';
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', email.trim().toLowerCase());
  if (error && error.code !== 'PGRST116') throw error;
  if (data && data.length > 0) {
    const hasOther = data.some((d) => d.role === otherRole);
    if (hasOther) return otherRole;
  }
  return null;
}

export async function supabaseInsertProfile(profile: UserProfile): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('profiles').delete().eq('email', profile.email.trim().toLowerCase());
  } catch {
    // Non-blocking cleanup of stale emails
  }

  const { error } = await supabase.from('profiles').insert([
    {
      id: profile.id,
      email: profile.email.trim().toLowerCase(),
      role: profile.role,
      name: profile.name,
      company_name: profile.companyName,
      phone_number: profile.phoneNumber,
      settlement_bank: profile.settlementBank,
      account_number: profile.accountNumber,
      business_name: profile.companyName,
      balance: profile.balance || 0,
    },
  ]);
  if (error) throw error;
}

export async function supabaseLoginProfile(
  email: string,
  role: UserRole
): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.trim().toLowerCase());
  if (error) throw error;

  if (data && data.length > 0) {
    const hasAdminProfile = data.find((p) => p.role === 'admin');
    let matchedProfile = hasAdminProfile || data.find((p) => p.role === role);

    if (!matchedProfile) {
      if (role === 'admin') return null;
      const existing = data[0];
      const { data: updated, error: updateErr } = await supabase
        .from('profiles')
        .update({ role: role })
        .eq('id', existing.id)
        .select()
        .single();
      if (updateErr) throw updateErr;
      matchedProfile = updated;
    }

    if (matchedProfile) {
      return {
        id: matchedProfile.id,
        email: matchedProfile.email,
        role: matchedProfile.role as UserRole,
        name: matchedProfile.name,
        companyName: matchedProfile.company_name,
        phoneNumber: matchedProfile.phone_number,
        balance: Number(matchedProfile.balance || 0),
        paystackSubaccountCode: matchedProfile.paystack_subaccount_code,
        settlementBank: matchedProfile.settlement_bank,
        accountNumber: matchedProfile.account_number,
        businessName: matchedProfile.business_name,
      };
    }
  }
  return null;
}

export async function supabaseGetProfile(id: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  if (data) {
    return {
      id: data.id,
      email: data.email,
      role: data.role as UserRole,
      name: data.name,
      companyName: data.company_name,
      phoneNumber: data.phone_number,
      balance: Number(data.balance || 0),
      paystackSubaccountCode: data.paystack_subaccount_code,
      settlementBank: data.settlement_bank,
      accountNumber: data.account_number,
      businessName: data.business_name,
    };
  }
  return null;
}

export async function supabaseUpdateProfile(
  id: string,
  updates: Partial<UserProfile>
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
  if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
  if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
  if (updates.paystackSubaccountCode !== undefined)
    dbUpdates.paystack_subaccount_code = updates.paystackSubaccountCode;
  if (updates.settlementBank !== undefined) dbUpdates.settlement_bank = updates.settlementBank;
  if (updates.accountNumber !== undefined) dbUpdates.account_number = updates.accountNumber;
  if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;

  const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', id);
  if (error) throw error;
}

export async function supabaseGetAllProfiles(): Promise<UserProfile[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (data) {
    return data.map((p) => ({
      id: p.id,
      email: p.email,
      role: p.role as UserRole,
      name: p.name || p.email.split('@')[0],
      companyName: p.company_name,
      phoneNumber: p.phone_number,
      balance: Number(p.balance || 0),
      paystackSubaccountCode: p.paystack_subaccount_code,
      settlementBank: p.settlement_bank,
      accountNumber: p.account_number,
      businessName: p.business_name,
    }));
  }
  return [];
}

export async function supabaseDeleteProfile(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('ticket_purchases').delete().eq('buyer_id', id);
  } catch {
    // non-blocking
  }
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
}
