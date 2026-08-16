import { UserProfile, UserRole, MovieTicket, TicketPurchase } from '../../types';
import { 
  supabase, 
  isSupabaseConfigured, 
  setSupabaseLastError, 
  getLocalData, 
  setLocalData, 
  addDeletedTicketId, 
  notifyTicketsChanged 
} from './client';
import { deleteTicket } from './tickets';

export async function checkEmailExists(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail);
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.length > 0) {
        return true;
      }
    } catch (e: any) {
      console.log('Supabase email exists check failed, falling back to LocalStorage:', e);
    }
  }

  const users = getLocalData<UserProfile[]>('users', []);
  return users.some(u => u.email.toLowerCase() === cleanEmail);
}

export async function checkEmailOppositeRole(email: string, role: UserRole): Promise<string | null> {
  const otherRole: UserRole = role === 'producer' ? 'buyer' : 'producer';
  
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', email.trim().toLowerCase());
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.length > 0) {
        const hasOther = data.some(d => d.role === otherRole);
        if (hasOther) {
          return otherRole;
        }
      }
    } catch (e: any) {
      console.log('Supabase opposite role check failed, falling back to LocalStorage:', e);
    }
  }

  const users = getLocalData<UserProfile[]>('users', []);
  const foundOther = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.role === otherRole);
  if (foundOther) {
    return otherRole;
  }

  return null;
}

export async function registerUser(profile: Omit<UserProfile, 'balance'>): Promise<UserProfile> {
  const fullProfile: UserProfile = { ...profile, balance: 0 };
  
  if (isSupabaseConfigured && supabase) {
    try {
      try {
        await supabase
          .from('profiles')
          .delete()
          .eq('email', fullProfile.email.trim().toLowerCase());
      } catch (delErr) {
        console.log('Failed to delete potentially orphaned profile:', delErr);
      }

      const { error } = await supabase.from('profiles').insert([
        {
          id: fullProfile.id,
          email: fullProfile.email.trim().toLowerCase(),
          role: fullProfile.role,
          name: fullProfile.name,
          company_name: fullProfile.companyName,
          phone_number: fullProfile.phoneNumber,
          settlement_bank: fullProfile.settlementBank,
          account_number: fullProfile.accountNumber,
          business_name: fullProfile.companyName,
          balance: 0
        }
      ]);
      if (error) throw error;
    } catch (e: any) {
      setSupabaseLastError(e?.message || String(e));
      console.log('Supabase registration failed, falling back to LocalStorage:', e);
    }
  }
  
  const users = getLocalData<UserProfile[]>('users', []);
  const filteredUsers = users.filter(u => u.id !== fullProfile.id && !(u.email.toLowerCase() === fullProfile.email.toLowerCase() && u.role === fullProfile.role));
  filteredUsers.push(fullProfile);
  setLocalData('users', filteredUsers);
  return fullProfile;
}

export async function loginUser(email: string, role: UserRole): Promise<UserProfile | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.trim().toLowerCase());
      if (error) throw error;
      
      if (data && data.length > 0) {
        const hasAdminProfile = data.find(p => p.role === 'admin');
        let matchedProfile = hasAdminProfile || data.find(p => p.role === role);
        
        if (!matchedProfile) {
          if (role === 'admin') {
            return null;
          }

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
            businessName: matchedProfile.business_name
          };
        }
      }
    } catch (e: any) {
      setSupabaseLastError(e?.message || String(e));
      console.log('Supabase login/role transition failed, falling back to LocalStorage:', e);
    }
  }

  const users = getLocalData<UserProfile[]>('users', []);
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (found) {
    if (found.role === 'admin') {
      return found;
    }
    if (role === 'admin') {
      return null;
    }
    if (found.role !== role) {
      found.role = role;
      setLocalData('users', users);
    }
    return found;
  }
  return null;
}

export async function getUserProfile(id: string): Promise<UserProfile | null> {
  let supabaseProfile: UserProfile | null = null;
  let fetchSucceeded = false;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (data) {
        supabaseProfile = {
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
          businessName: data.business_name
        };
        fetchSucceeded = true;
      }
    } catch (e: any) {
      setSupabaseLastError(e?.message || String(e));
      console.log('Supabase profile fetch failed, falling back to LocalStorage:', e);
    }
  }

  const users = getLocalData<UserProfile[]>('users', []);
  const localProfile = users.find(u => u.id === id) || null;

  if (fetchSucceeded && supabaseProfile) {
    return supabaseProfile;
  }
  return localProfile;
}

export async function updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
      if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
      if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
      if (updates.paystackSubaccountCode !== undefined) dbUpdates.paystack_subaccount_code = updates.paystackSubaccountCode;
      if (updates.settlementBank !== undefined) dbUpdates.settlement_bank = updates.settlementBank;
      if (updates.accountNumber !== undefined) dbUpdates.account_number = updates.accountNumber;
      if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
    } catch (e: any) {
      console.log('Supabase profile update failed or column missing, updating LocalStorage:', e);
    }
  }

  const users = getLocalData<UserProfile[]>('users', []);
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    setLocalData('users', users);
    return users[idx];
  }
  
  const current = await getUserProfile(id);
  if (current) {
    const updated = { ...current, ...updates };
    const filteredUsers = users.filter(u => u.id !== id);
    filteredUsers.push(updated);
    setLocalData('users', filteredUsers);
    return updated;
  }

  return null;
}

export async function generatePaystackSubaccount(userOrId: UserProfile | string): Promise<string | null> {
  let user: UserProfile | null = null;
  if (typeof userOrId === 'string') {
    user = await getUserProfile(userOrId);
  } else {
    user = userOrId;
  }

  if (!user) return null;

  if (user.paystackSubaccountCode) {
    return user.paystackSubaccountCode;
  }

  try {
    const businessName = user.companyName || user.name || `Producer ${user.id}`;
    const settlementBank = user.settlementBank || "MTN";
    let accountNumber = user.phoneNumber || "";
    accountNumber = accountNumber.replace(/\D/g, "");
    if (accountNumber.length < 10) {
      accountNumber = "0" + Math.floor(200000000 + Math.random() * 800000000).toString();
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
          primary_contact_email: user.email
        })
      });

      if (res && res.ok) {
        const result = await res.json();
        if (result.status && result.data?.subaccount_code) {
          subaccountCode = result.data.subaccount_code;
        }
      }
    } catch (fetchErr) {
      // In offline/test environments, fetch will fail gracefully
    }

    if (!subaccountCode) {
      subaccountCode = `SUB_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    }

    await updateUserProfile(user.id, {
      paystackSubaccountCode: subaccountCode,
      settlementBank: settlementBank,
      accountNumber: accountNumber,
      businessName: businessName
    });
    return subaccountCode;
  } catch (err) {
    console.error("[Auto-Subaccount] Error generating subaccount:", err);
  }
  return null;
}

export async function checkUserEmailConfirmed(): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) {
        return !!user.email_confirmed_at;
      }
    } catch (e) {
      console.warn('Error checking user email confirmation status:', e);
    }
  }
  return true;
}

export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`
        }
      });
      if (error) throw error;
      return { success: true, message: 'Verification link resent successfully! Please check your inbox and spam folder.' };
    } catch (e: any) {
      console.error('Error resending verification email:', e);
      const errMsg = e?.message || '';
      if (errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('too many requests')) {
        return {
          success: false,
          message: 'Email rate limit exceeded. Please check your spam/junk folder for the previous email, or wait a few minutes before trying again.'
        };
      }
      return { success: false, message: errMsg || 'Failed to resend verification email.' };
    }
  }
  return { success: true, message: 'Simulation mode: verification email resent successfully!' };
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  let supabaseProfiles: UserProfile[] = [];
  let fetchSucceeded = false;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        supabaseProfiles = data.map(p => ({
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
          businessName: p.business_name
        }));
        fetchSucceeded = true;
      }
    } catch (e: any) {
      console.warn('Supabase getAllProfiles failed, falling back to LocalStorage:', e?.message || e);
    }
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
  if (uniqueLocalUsers.length !== localUsers.length) {
    setLocalData('users', uniqueLocalUsers);
  }

  if (fetchSucceeded) {
    const merged = [...supabaseProfiles];
    for (const lu of uniqueLocalUsers) {
      if (!merged.some(u => u.id === lu.id)) {
        merged.push(lu);
      }
    }
    return merged;
  }

  return uniqueLocalUsers;
}

export async function deleteProfile(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      try {
        await supabase.from('ticket_purchases').delete().eq('buyer_id', id);
      } catch (e) {
        console.warn('Silent purchase delete issue during user deletion:', e);
      }

      try {
        const { data: tickets } = await supabase
          .from('movie_tickets')
          .select('id')
          .eq('producer_id', id);

        if (tickets && tickets.length > 0) {
          for (const t of tickets) {
            await deleteTicket(t.id, true);
          }
        }
      } catch (e) {
        console.warn('Silent ticket assets delete issue during user deletion:', e);
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      setSupabaseLastError(e?.message || String(e));
      console.warn('Supabase deleteProfile failed, falling back to LocalStorage:', e?.message || e);
    }
  }

  const users = getLocalData<UserProfile[]>('users', []);
  const filteredUsers = users.filter(u => u.id !== id);
  setLocalData('users', filteredUsers);

  const tickets = getLocalData<MovieTicket[]>('tickets', []);
  const producerTickets = tickets.filter(t => t.producerId === id);
  producerTickets.forEach(t => addDeletedTicketId(t.id));

  const filteredTickets = tickets.filter(t => t.producerId !== id);
  setLocalData('tickets', filteredTickets);

  const purchases = getLocalData<TicketPurchase[]>('purchases', []);
  const filteredPurchases = purchases.filter(p => p.buyerId !== id && !tickets.some(t => t.id === p.ticketId && t.producerId === id));
  setLocalData('purchases', filteredPurchases);

  notifyTicketsChanged();
  return true;
}
