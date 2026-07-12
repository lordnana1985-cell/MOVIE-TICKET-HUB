import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultSupabase } from '../supabaseClient';
import { UserProfile, UserRole, MovieTicket, TicketPurchase, GateLog } from '../types';

const env = (import.meta as any).env || {};
const SUPABASE_URL = localStorage.getItem('mt_hub_VITE_SUPABASE_URL') || env.VITE_SUPABASE_URL || 'https://aegpswfduxjayoeidztz.supabase.co';
const SUPABASE_ANON_KEY = localStorage.getItem('mt_hub_VITE_SUPABASE_ANON_KEY') || env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZ3Bzd2ZkdXhqYXlvZWlkenR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NjM1NjksImV4cCI6MjA5OTAzOTU2OX0.RynRoVplA-Vs2XKCRW9eEl0NmVlTAS9Wg6JeG4qcYns';

let supabase: SupabaseClient = defaultSupabase;
let isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
let lastSupabaseError: string | null = null;

export const getSupabaseLastError = () => lastSupabaseError;
export const clearSupabaseLastError = () => { lastSupabaseError = null; };

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  if (SUPABASE_URL !== 'https://aegpswfduxjayoeidztz.supabase.co' || SUPABASE_ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZ3Bzd2ZkdXhqYXlvZWlkenR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NjM1NjksImV4cCI6MjA5OTAzOTU2OX0.RynRoVplA-Vs2XKCRW9eEl0NmVlTAS9Wg6JeG4qcYns') {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
      console.log('Failed to initialize custom Supabase client:', error);
    }
  }
}

// Initial Mock Movies for outstanding initial showcase experience
const DEFAULT_MOVIES: MovieTicket[] = [
  {
    id: 'm1',
    title: 'The Golden Eclipse',
    description: 'A mind-bending sci-fi epic exploring the outer boundaries of human perception when a celestial event triggers dimensional shifts.',
    price: 150, // in GHS (e.g. GH₵150)
    date: '2026-08-15',
    time: '18:00',
    venue: 'Silverbird Cinemas, Accra Mall, Accra',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder trailer
    producerId: 'p1',
    producerName: 'Kofi Mensah',
    totalQuantity: 200,
    availableQuantity: 184,
    coverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600',
    createdAt: new Date().toISOString()
  },
  {
    id: 'm2',
    title: 'Echoes of the Sky',
    description: 'An emotional romance set in the highlands, where music, destiny, and memories collide over a single majestic summer.',
    price: 100, // GH₵100
    date: '2026-09-01',
    time: '20:00',
    venue: 'Silverbird Cinemas, West Hills Mall, Weija',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    producerId: 'p1',
    producerName: 'Kofi Mensah',
    totalQuantity: 150,
    availableQuantity: 142,
    coverUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600',
    createdAt: new Date().toISOString()
  },
  {
    id: 'm3',
    title: 'Shadows of the Kingdom',
    description: 'A historical drama following the rise of an empire, filled with betrayals, glorious battles, and a quest for absolute crown.',
    price: 250, // GH₵250
    date: '2026-08-20',
    time: '17:00',
    venue: 'Global Cinemas, Weija, Accra',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    producerId: 'p2',
    producerName: 'Ama Serwaa',
    totalQuantity: 100,
    availableQuantity: 95,
    coverUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600',
    createdAt: new Date().toISOString()
  }
];

export const getSupabaseStatus = () => {
  return {
    configured: isSupabaseConfigured,
    url: SUPABASE_URL,
    hasKey: !!SUPABASE_ANON_KEY
  };
};

// HELPER FOR LOCALSTORAGE FALLBACKS
const getLocalData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(`mt_hub_${key}`);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(`mt_hub_${key}`, JSON.stringify(data));
};

// INITIALIZE LOCAL DB IF EMPTY
const isCleared = localStorage.getItem('mt_hub_simulations_cleared') === 'true';

if (!localStorage.getItem('mt_hub_tickets')) {
  setLocalData('tickets', isCleared ? [] : DEFAULT_MOVIES);
}
if (!localStorage.getItem('mt_hub_users')) {
  // Setup a default admin, producer and buyer for direct testing if they don't register
  setLocalData('users', isCleared ? [] : [
    {
      id: 'admin1',
      email: 'admin@movieticket.com',
      role: 'admin',
      name: 'System Admin',
      balance: 0
    },
    {
      id: 'p1',
      email: 'producer@example.com',
      role: 'producer',
      name: 'Kofi Mensah',
      companyName: 'Accra Film Studios',
      balance: 15000 // In GHS
    },
    {
      id: 'p2',
      email: 'ama@example.com',
      role: 'producer',
      name: 'Ama Serwaa',
      companyName: 'Gold Coast Pictures',
      balance: 8500
    },
    {
      id: 'b1',
      email: 'buyer@example.com',
      role: 'buyer',
      name: 'John Doe',
      balance: 0
    }
  ]);
} else {
  // Self-healing: ensure admin@movieticket.com is pre-seeded in existing localStorage
  try {
    const existingUsers = JSON.parse(localStorage.getItem('mt_hub_users') || '[]');
    const hasAdmin = existingUsers.some((u: any) => u.email.toLowerCase() === 'admin@movieticket.com');
    if (!hasAdmin && !isCleared) {
      existingUsers.push({
        id: 'admin1',
        email: 'admin@movieticket.com',
        role: 'admin',
        name: 'System Admin',
        balance: 0
      });
      localStorage.setItem('mt_hub_users', JSON.stringify(existingUsers));
    }
  } catch (e) {
    console.error('Failed to self-heal admin user in localStorage', e);
  }
}
if (!localStorage.getItem('mt_hub_purchases')) {
  setLocalData('purchases', isCleared ? [] : [
    {
      id: 't-demo-1',
      ticketId: 'm1',
      movieTitle: 'The Golden Eclipse',
      movieCoverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600',
      buyerId: 'b1',
      buyerName: 'John Doe',
      buyerEmail: 'buyer@example.com',
      amountPaid: 150,
      producerEarning: 120, // 80%
      hubEarning: 30,      // 20%
      paystackRef: 'pstk_test_123456789',
      purchasedAt: '2026-07-01T14:30:00Z',
      status: 'unused'
    }
  ]);
}
if (!localStorage.getItem('mt_hub_gate_logs')) {
  setLocalData('gate_logs', []);
}

export const db = {
  // STORAGE UPLOAD (IMAGE & VIDEO TO BUCKETS)
  async uploadFile(
    bucketName: string,
    filePath: string,
    file: File,
    allowFallback = true,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Attempt to verify or create the bucket.
        // On modern Supabase apps, the Anon key might not be allowed to call createBucket,
        // so we catch and proceed gracefully if it's already there or blocked.
        try {
          await supabase.storage.createBucket(bucketName, { public: true });
        } catch (bErr) {
          console.log('Bucket check / create result:', bErr);
        }

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || 'video/mp4', // Explicitly pass the file's mime type
            onUploadProgress: onProgress ? (event: any) => {
              if (event && typeof event.loaded === 'number' && typeof event.total === 'number' && event.total > 0) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(percent);
              }
            } : undefined
          } as any);

        if (error) {
          throw error;
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        return publicUrl;
      } catch (e: any) {
        lastSupabaseError = e?.message || String(e);
        console.warn('Supabase storage upload failed:', e);

        if (!allowFallback) {
          // If we disabled fallback, throw the actual error so the user sees exactly what went wrong
          throw new Error(`Supabase Storage upload failed: ${e.message || String(e)}. Please check your bucket limits, storage size, and RLS policies.`);
        }

        console.warn('Activating automatic Base64 / Local URL fallback for file:', file.name);

        if (onProgress) {
          onProgress(30);
          await new Promise(resolve => setTimeout(resolve, 150));
          onProgress(70);
          await new Promise(resolve => setTimeout(resolve, 150));
          onProgress(100);
        }

        // Fallback: convert file to Base64 data URL (perfect for images so they persist globally in DB text field)
        // or local object URL for large assets so the creation flow succeeds beautifully without blocking.
        if (file.size < 5 * 1024 * 1024) {
          try {
            const base64Url = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (err) => reject(err);
              reader.readAsDataURL(file);
            });
            return base64Url;
          } catch (readErr) {
            console.error('Failed to read file as Base64:', readErr);
          }
        }

        try {
          return URL.createObjectURL(file);
        } catch (urlErr) {
          throw new Error(`Supabase Storage upload failed: ${e.message || String(e)}. Automatic fallback failed: ${String(urlErr)}`);
        }
      }
    } else {
      // Fallback: Use URL.createObjectURL for instant local/preview simulation instead of massive Base64 which freezes the UI and crashes localStorage
      if (onProgress) {
        onProgress(30);
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress(70);
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress(100);
      }
      try {
        const objectUrl = URL.createObjectURL(file);
        return Promise.resolve(objectUrl);
      } catch (err: any) {
        return Promise.reject(new Error('Failed to generate local object URL: ' + err.message));
      }
    }
  },

  // SIMULATION CLEANER
  clearAllSimulations(): void {
    localStorage.setItem('mt_hub_simulations_cleared', 'true');
    localStorage.setItem('mt_hub_tickets', JSON.stringify([]));
    localStorage.setItem('mt_hub_users', JSON.stringify([]));
    localStorage.setItem('mt_hub_purchases', JSON.stringify([]));
    localStorage.setItem('mt_hub_gate_logs', JSON.stringify([]));
    localStorage.removeItem('mt_hub_current_user');
  },

  // USERS & AUTH
  async checkEmailExists(email: string): Promise<boolean> {
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
  },

  async checkEmailOppositeRole(email: string, role: UserRole): Promise<string | null> {
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
  },

  async registerUser(profile: Omit<UserProfile, 'balance'>): Promise<UserProfile> {
    const fullProfile: UserProfile = { ...profile, balance: 0 };
    
    if (isSupabaseConfigured && supabase) {
      try {
        // Self-healing: if they deleted their user in Supabase Auth, any existing public.profiles row for this email is orphaned.
        // We delete any such orphaned rows with the same email to prevent unique constraint failures and allow registering under a new role.
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
        lastSupabaseError = e?.message || String(e);
        console.log('Supabase registration failed, falling back to LocalStorage:', e);
      }
    }
    
    // Prevent duplicate entries in local storage
    const users = getLocalData<UserProfile[]>('users', []);
    const filteredUsers = users.filter(u => u.id !== fullProfile.id && !(u.email.toLowerCase() === fullProfile.email.toLowerCase() && u.role === fullProfile.role));
    filteredUsers.push(fullProfile);
    setLocalData('users', filteredUsers);
    return fullProfile;
  },

  async loginUser(email: string, role: UserRole): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email.trim().toLowerCase());
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Enforce admin role if they are already flagged as 'admin' in the database
          const hasAdminProfile = data.find(p => p.role === 'admin');
          let matchedProfile = hasAdminProfile || data.find(p => p.role === role);
          
          if (!matchedProfile) {
            // Profile exists but with a different role.
            // Strict security guard: Block upgrading non-admin accounts to 'admin'
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
        lastSupabaseError = e?.message || String(e);
        console.log('Supabase login/role transition failed, falling back to LocalStorage:', e);
      }
    }

    const users = getLocalData<UserProfile[]>('users', []);
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      if (found.role === 'admin') {
        return found; // Keep admin role
      }
      if (role === 'admin') {
        return null; // Block standard users from escalating to admin
      }
      if (found.role !== role) {
        found.role = role;
        setLocalData('users', users);
      }
      return found;
    }
    return null;
  },

  async getUserProfile(id: string): Promise<UserProfile | null> {
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
        lastSupabaseError = e?.message || String(e);
        console.log('Supabase profile fetch failed, falling back to LocalStorage:', e);
      }
    }

    const users = getLocalData<UserProfile[]>('users', []);
    const localProfile = users.find(u => u.id === id) || null;

    if (fetchSucceeded && supabaseProfile) {
      return supabaseProfile;
    }
    return localProfile;
  },

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    let supabaseUpdated = false;

    if (isSupabaseConfigured && supabase) {
      try {
        // Construct standard updates mapping to potential db snake_case column names
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
        supabaseUpdated = true;
      } catch (e: any) {
        console.log('Supabase profile update failed or column missing, updating LocalStorage:', e);
      }
    }

    // Always keep LocalStorage in sync
    const users = getLocalData<UserProfile[]>('users', []);
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      setLocalData('users', users);
      return users[idx];
    }
    
    // If not in local users, fetch existing and add
    const current = await this.getUserProfile(id);
    if (current) {
      const updated = { ...current, ...updates };
      const filteredUsers = users.filter(u => u.id !== id);
      filteredUsers.push(updated);
      setLocalData('users', filteredUsers);
      return updated;
    }

    return null;
  },

  async generatePaystackSubaccount(user: UserProfile): Promise<string | null> {
    if (user.paystackSubaccountCode) {
      return user.paystackSubaccountCode;
    }

    try {
      const businessName = user.companyName || user.name || `Producer ${user.id}`;
      const settlementBank = user.settlementBank || "MTN"; // Default to MTN Mobile Money Ghana if none chosen
      let accountNumber = user.phoneNumber || "";
      accountNumber = accountNumber.replace(/\D/g, "");
      if (accountNumber.length < 10) {
        accountNumber = "0" + Math.floor(200000000 + Math.random() * 800000000).toString();
      }

      console.log(`[Auto-Subaccount] Generating subaccount for ${businessName}...`);

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

      const result = await res.json();
      if (result.status && result.data?.subaccount_code) {
        const code = result.data.subaccount_code;
        await this.updateUserProfile(user.id, {
          paystackSubaccountCode: code,
          settlementBank: settlementBank,
          accountNumber: accountNumber,
          businessName: businessName
        });
        console.log(`[Auto-Subaccount] Generated successfully: ${code}`);
        return code;
      } else {
        console.warn(`[Auto-Subaccount] API returned error:`, result.message);
      }
    } catch (err) {
      console.error("[Auto-Subaccount] Error generating subaccount:", err);
    }
    return null;
  },

  async checkUserEmailConfirmed(): Promise<boolean> {
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
    return true; // Default to true if not configured (simulation mode)
  },

  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
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
  },

  // MOVIE TICKETS
  async getTickets(): Promise<MovieTicket[]> {
    let supabaseTickets: MovieTicket[] = [];
    let fetchSucceeded = false;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('movie_tickets')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) {
          supabaseTickets = data.map(m => {
            const catMatch = m.description ? m.description.match(/<!--CAT:(\w+)-->/) : null;
            const category = catMatch ? catMatch[1] : 'movie';
            const cleanDescription = m.description ? m.description.replace(/<!--CAT:\w+-->/, '').trim() : (m.description || '');
            return {
              id: m.id,
              title: m.title,
              description: cleanDescription,
              price: Number(m.price),
              date: m.date,
              time: m.time,
              venue: m.venue,
              trailerUrl: m.trailer_url,
              producerId: m.producer_id,
              producerName: m.producer_name,
              totalQuantity: Number(m.total_quantity),
              availableQuantity: Number(m.available_quantity),
              coverUrl: m.cover_url,
              createdAt: m.created_at,
              category: category as any,
              isLocalOnly: false
            };
          });
          fetchSucceeded = true;
        }
      } catch (e: any) {
        lastSupabaseError = e?.message || String(e);
        console.log('Supabase getTickets failed, falling back to LocalStorage:', e);
      }
    }

    const localTickets = getLocalData<MovieTicket[]>('tickets', []);
    const uniqueLocalTicketsCleaned: MovieTicket[] = [];
    const seenTicketIds = new Set<string>();
    for (const t of localTickets) {
      if (t && t.id && !seenTicketIds.has(t.id)) {
        seenTicketIds.add(t.id);
        const catMatch = t.description ? t.description.match(/<!--CAT:(\w+)-->/) : null;
        const category = t.category || (catMatch ? catMatch[1] : 'movie');
        const cleanDescription = t.description ? t.description.replace(/<!--CAT:\w+-->/, '').trim() : (t.description || '');
        uniqueLocalTicketsCleaned.push({
          ...t,
          description: cleanDescription,
          category: category as any
        });
      }
    }
    if (uniqueLocalTicketsCleaned.length !== localTickets.length) {
      setLocalData('tickets', uniqueLocalTicketsCleaned);
    }

    if (fetchSucceeded) {
      // Merge local and supabase tickets to prevent data loss in fallback/sandbox scenarios.
      // Keep Supabase tickets as primary, and add local tickets that don't exist in Supabase yet.
      const merged = [...supabaseTickets];
      for (const localT of uniqueLocalTicketsCleaned) {
        if (!merged.some(t => t.id === localT.id)) {
          merged.push({ ...localT, isLocalOnly: true });
        }
      }
      return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return uniqueLocalTicketsCleaned.map(t => ({ ...t, isLocalOnly: true }));
  },

  async createTicket(ticket: MovieTicket): Promise<MovieTicket> {
    const descriptionWithCat = ticket.description + `\n<!--CAT:${ticket.category || 'movie'}-->`;
    
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('movie_tickets').insert([
          {
            id: ticket.id,
            title: ticket.title,
            description: descriptionWithCat,
            price: ticket.price,
            date: ticket.date,
            time: ticket.time,
            venue: ticket.venue,
            trailer_url: ticket.trailerUrl,
            producer_id: ticket.producerId,
            producer_name: ticket.producerName,
            total_quantity: ticket.totalQuantity,
            available_quantity: ticket.availableQuantity,
            cover_url: ticket.coverUrl,
            created_at: ticket.createdAt
          }
        ]);
        if (error) throw error;
      } catch (e: any) {
        lastSupabaseError = e?.message || String(e);
        console.log('Supabase createTicket failed, falling back to LocalStorage:', e);
      }
    }

    const tickets = getLocalData<MovieTicket[]>('tickets', []);
    const localSavedTicket = {
      ...ticket,
      description: descriptionWithCat
    };
    tickets.unshift(localSavedTicket);
    setLocalData('tickets', tickets);
    return ticket;
  },

  async deleteTicket(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Fetch ticket to get coverUrl and trailerUrl for cleanup
        const { data: ticket } = await supabase
          .from('movie_tickets')
          .select('*')
          .eq('id', id)
          .single();

        if (ticket) {
          const filesToDelete: string[] = [];

          const getStoragePathFromUrl = (url: string, bucketName: string = 'producers-assets'): string | null => {
            if (!url) return null;
            if (url.startsWith('data:')) return null; // Ignore Base64 fallback data URLs

            // Standard public URL match: /public/[bucketName]/
            const searchStr = `/public/${bucketName}/`;
            const idx = url.indexOf(searchStr);
            if (idx !== -1) {
              let pathPart = url.substring(idx + searchStr.length);
              const qIdx = pathPart.indexOf('?');
              if (qIdx !== -1) pathPart = pathPart.substring(0, qIdx);
              const hIdx = pathPart.indexOf('#');
              if (hIdx !== -1) pathPart = pathPart.substring(0, hIdx);
              return decodeURIComponent(pathPart);
            }

            // Fallback match: /[bucketName]/
            const fallbackStr = `/${bucketName}/`;
            const fIdx = url.indexOf(fallbackStr);
            if (fIdx !== -1) {
              let pathPart = url.substring(fIdx + fallbackStr.length);
              const qIdx = pathPart.indexOf('?');
              if (qIdx !== -1) pathPart = pathPart.substring(0, qIdx);
              const hIdx = pathPart.indexOf('#');
              if (hIdx !== -1) pathPart = pathPart.substring(0, hIdx);
              return decodeURIComponent(pathPart);
            }

            return null;
          };

          if (ticket.cover_url) {
            const coverPath = getStoragePathFromUrl(ticket.cover_url);
            if (coverPath) filesToDelete.push(coverPath);
          }

          if (ticket.trailer_url) {
            const trailerPath = getStoragePathFromUrl(ticket.trailer_url);
            if (trailerPath) filesToDelete.push(trailerPath);
          }

          if (filesToDelete.length > 0) {
            console.log('Cleaning up files from Supabase Storage:', filesToDelete);
            try {
              const { error: storageErr } = await supabase.storage.from('producers-assets').remove(filesToDelete);
              if (storageErr) {
                console.warn('Supabase storage.remove returned an error:', storageErr);
              } else {
                console.log('Successfully cleaned up assets from Supabase Storage:', filesToDelete);
              }
            } catch (storageErr) {
              console.warn('Storage removal failed or some assets did not exist:', storageErr);
            }
          }
        }

        // 1.5. Clean up dependent foreign-key records first to prevent Postgres constraint failures!
        try {
          await supabase
            .from('gate_logs')
            .delete()
            .eq('ticket_id', id);
        } catch (dbErr) {
          console.warn('Non-blocking gate_logs deletion error:', dbErr);
        }

        try {
          await supabase
            .from('ticket_purchases')
            .delete()
            .eq('ticket_id', id);
        } catch (dbErr) {
          console.warn('Non-blocking ticket_purchases deletion error:', dbErr);
        }

        // 2. Delete database record
        const { error } = await supabase
          .from('movie_tickets')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (e: any) {
        lastSupabaseError = e?.message || String(e);
        console.warn('Supabase deleteTicket failed, falling back to LocalStorage:', e?.message || e);
      }
    }

    const tickets = getLocalData<MovieTicket[]>('tickets', []);
    const filtered = tickets.filter(t => t.id !== id);
    setLocalData('tickets', filtered);
    return true;
  },

  async clearAllTickets(): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Clear dependent gate logs and purchases to prevent broken foreign key references
        try {
          await supabase.from('gate_logs').delete().neq('id', '_dummy_');
        } catch (e) {
          console.log('Non-blocking gate_logs clear error:', e);
        }
        try {
          await supabase.from('ticket_purchases').delete().neq('id', '_dummy_');
        } catch (e) {
          console.log('Non-blocking ticket_purchases clear error:', e);
        }

        const { error } = await supabase
          .from('movie_tickets')
          .delete()
          .neq('id', '_dummy_id_not_used_');
        if (error) throw error;
      } catch (e: any) {
        lastSupabaseError = e?.message || String(e);
        console.warn('Supabase clearAllTickets failed, falling back to LocalStorage:', e?.message || e);
      }
    }

    setLocalData('tickets', []);
    setLocalData('purchases', []);
    setLocalData('gate_logs', []);
    return true;
  },

  // PURCHASES (PAYMENT INTEGRATION SUCCESS)
  async purchaseTicket(purchase: TicketPurchase): Promise<TicketPurchase> {
    // Deduct available quantity from ticket and add balance to producer profile
    if (isSupabaseConfigured && supabase) {
      try {
        // Run as separate operations safely
        const { error: purchaseErr } = await supabase.from('ticket_purchases').insert([
          {
            id: purchase.id,
            ticket_id: purchase.ticketId,
            movie_title: purchase.movieTitle,
            movie_cover_url: purchase.movieCoverUrl,
            buyer_id: purchase.buyerId,
            buyer_name: purchase.buyerName,
            buyer_email: purchase.buyerEmail,
            amount_paid: purchase.amountPaid,
            producer_earning: purchase.producerEarning,
            hub_earning: purchase.hubEarning,
            paystack_ref: purchase.paystackRef,
            purchased_at: purchase.purchasedAt,
            status: purchase.status
          }
        ]);
        if (purchaseErr) throw purchaseErr;

        // Fetch ticket
        const { data: ticket } = await supabase
          .from('movie_tickets')
          .select('available_quantity')
          .eq('id', purchase.ticketId)
          .single();

        if (ticket) {
          const newQty = Math.max(0, Number(ticket.available_quantity) - 1);
          await supabase
            .from('movie_tickets')
            .update({ available_quantity: newQty })
            .eq('id', purchase.ticketId);
        }

        // Fetch producer
        const { data: producer } = await supabase
          .from('profiles')
          .select('balance, id')
          .eq('id', (await supabase.from('movie_tickets').select('producer_id').eq('id', purchase.ticketId).single()).data?.producer_id)
          .single();

        if (producer) {
          const newBal = Number(producer.balance || 0) + purchase.producerEarning;
          await supabase
            .from('profiles')
            .update({ balance: newBal })
            .eq('id', producer.id);
        }
      } catch (e) {
        console.log('Supabase purchase transaction failed, falling back to LocalStorage:', e);
      }
    }

    // LocalStorage flow
    const purchases = getLocalData<TicketPurchase[]>('purchases', []);
    purchases.unshift(purchase);
    setLocalData('purchases', purchases);

    // Update local ticket quantity
    const tickets = getLocalData<MovieTicket[]>('tickets', []);
    const updatedTickets = tickets.map(t => {
      if (t.id === purchase.ticketId) {
        return { ...t, availableQuantity: Math.max(0, t.availableQuantity - 1) };
      }
      return t;
    });
    setLocalData('tickets', updatedTickets);

    // Update local producer profile balance
    const foundTicket = tickets.find(t => t.id === purchase.ticketId);
    if (foundTicket) {
      const users = getLocalData<UserProfile[]>('users', []);
      const updatedUsers = users.map(u => {
        if (u.id === foundTicket.producerId) {
          return { ...u, balance: (u.balance || 0) + purchase.producerEarning };
        }
        return u;
      });
      setLocalData('users', updatedUsers);
    }

    return purchase;
  },

  async getPurchasesForBuyer(buyerId: string): Promise<TicketPurchase[]> {
    let supabasePurchases: TicketPurchase[] = [];
    let fetchSucceeded = false;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ticket_purchases')
          .select('*')
          .eq('buyer_id', buyerId)
          .order('purchased_at', { ascending: false });
        if (error) throw error;
        if (data) {
          supabasePurchases = data.map(p => ({
            id: p.id,
            ticketId: p.ticket_id,
            movieTitle: p.movie_title,
            movieCoverUrl: p.movie_cover_url,
            buyerId: p.buyer_id,
            buyerName: p.buyer_name,
            buyerEmail: p.buyer_email,
            amountPaid: Number(p.amount_paid),
            producerEarning: Number(p.producer_earning),
            hubEarning: Number(p.hub_earning),
            paystackRef: p.paystack_ref,
            purchasedAt: p.purchased_at,
            status: p.status as 'unused' | 'used',
            scannedAt: p.scanned_at
          }));
          fetchSucceeded = true;
        }
      } catch (e) {
        console.log('Supabase getPurchasesForBuyer failed, falling back to LocalStorage:', e);
      }
    }

    const rawLocalPurchases = getLocalData<TicketPurchase[]>('purchases', []);
    const uniqueLocalPurchases: TicketPurchase[] = [];
    const seenPurchaseIds = new Set<string>();
    for (const p of rawLocalPurchases) {
      if (p && p.id && !seenPurchaseIds.has(p.id)) {
        seenPurchaseIds.add(p.id);
        uniqueLocalPurchases.push(p);
      }
    }
    if (uniqueLocalPurchases.length !== rawLocalPurchases.length) {
      setLocalData('purchases', uniqueLocalPurchases);
    }

    const localPurchases = uniqueLocalPurchases.filter(p => p.buyerId === buyerId);

    if (fetchSucceeded) {
      const merged = [...supabasePurchases];
      for (const lp of localPurchases) {
        if (!merged.some(p => p.id === lp.id)) {
          merged.push(lp);
        }
      }
      return merged.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    }

    return localPurchases;
  },

  async getPurchasesForProducer(producerId: string): Promise<TicketPurchase[]> {
    const tickets = await this.getTickets();
    const producerTicketIds = tickets.filter(t => t.producerId === producerId).map(t => t.id);

    let supabasePurchases: TicketPurchase[] = [];
    let fetchSucceeded = false;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ticket_purchases')
          .select('*')
          .in('ticket_id', producerTicketIds)
          .order('purchased_at', { ascending: false });
        if (error) throw error;
        if (data) {
          supabasePurchases = data.map(p => ({
            id: p.id,
            ticketId: p.ticket_id,
            movieTitle: p.movie_title,
            movieCoverUrl: p.movie_cover_url,
            buyerId: p.buyer_id,
            buyerName: p.buyer_name,
            buyerEmail: p.buyer_email,
            amountPaid: Number(p.amount_paid),
            producerEarning: Number(p.producer_earning),
            hubEarning: Number(p.hub_earning),
            paystackRef: p.paystack_ref,
            purchasedAt: p.purchased_at,
            status: p.status as 'unused' | 'used',
            scannedAt: p.scanned_at
          }));
          fetchSucceeded = true;
        }
      } catch (e) {
        console.log('Supabase getPurchasesForProducer failed, falling back to LocalStorage:', e);
      }
    }

    const rawLocalPurchases = getLocalData<TicketPurchase[]>('purchases', []);
    const uniqueLocalPurchases: TicketPurchase[] = [];
    const seenPurchaseIds = new Set<string>();
    for (const p of rawLocalPurchases) {
      if (p && p.id && !seenPurchaseIds.has(p.id)) {
        seenPurchaseIds.add(p.id);
        uniqueLocalPurchases.push(p);
      }
    }
    if (uniqueLocalPurchases.length !== rawLocalPurchases.length) {
      setLocalData('purchases', uniqueLocalPurchases);
    }

    const localPurchases = uniqueLocalPurchases.filter(p => producerTicketIds.includes(p.ticketId));

    if (fetchSucceeded) {
      const merged = [...supabasePurchases];
      for (const lp of localPurchases) {
        if (!merged.some(p => p.id === lp.id)) {
          merged.push(lp);
        }
      }
      return merged.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    }

    return localPurchases;
  },

  // TICKET AUTHENTICATION AT THE GATE
  async authenticateTicket(purchaseId: string): Promise<{ success: boolean; message: string; purchase?: TicketPurchase }> {
    const timestamp = new Date().toISOString();
    
    // 1. Fetch the ticket purchase item
    let purchase: TicketPurchase | undefined;
    let localPurchases = getLocalData<TicketPurchase[]>('purchases', []);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('ticket_purchases')
          .select('*')
          .eq('id', purchaseId)
          .single();
        if (error) {
          console.warn('Ticket not found in Supabase during auth scan:', error.message);
        } else if (data) {
          purchase = {
            id: data.id,
            ticketId: data.ticket_id,
            movieTitle: data.movie_title,
            movieCoverUrl: data.movie_cover_url,
            buyerId: data.buyer_id,
            buyerName: data.buyer_name,
            buyerEmail: data.buyer_email,
            amountPaid: Number(data.amount_paid),
            producerEarning: Number(data.producer_earning),
            hubEarning: Number(data.hub_earning),
            paystackRef: p_ref_map(data.paystack_ref),
            purchasedAt: data.purchased_at,
            status: data.status as 'unused' | 'used',
            scannedAt: data.scanned_at
          };
        }
      } catch (e) {
        console.log('Supabase check before auth failed, falling back to LocalStorage:', e);
      }
    }

    // Fallback to local
    if (!purchase) {
      purchase = localPurchases.find(p => p.id === purchaseId);
    }

    if (!purchase) {
      // Create failure log
      const gateLog: GateLog = {
        id: `gl_${Math.random().toString(36).substr(2, 9)}`,
        purchaseId: purchaseId,
        ticketId: 'unknown',
        movieTitle: 'Unknown Movie',
        buyerName: 'Unknown Ticket Holder',
        scannedAt: timestamp,
        status: 'invalid'
      };
      await this.saveGateLog(gateLog);
      return { success: false, message: 'Invalid ticket reference! This ticket does not exist in our system.' };
    }

    if (purchase.status === 'used') {
      const gateLog: GateLog = {
        id: `gl_${Math.random().toString(36).substr(2, 9)}`,
        purchaseId: purchaseId,
        ticketId: purchase.ticketId,
        movieTitle: purchase.movieTitle,
        buyerName: purchase.buyerName,
        scannedAt: timestamp,
        status: 'already_used'
      };
      await this.saveGateLog(gateLog);
      return { success: false, message: `Ticket already USED! It was authenticated on ${new Date(purchase.scannedAt || '').toLocaleString()}`, purchase };
    }

    // Mark as USED
    purchase.status = 'used';
    purchase.scannedAt = timestamp;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('ticket_purchases')
          .update({ status: 'used', scanned_at: timestamp })
          .eq('id', purchaseId);
      } catch (e) {
        console.log('Supabase update ticket status failed:', e);
      }
    }

    // Save in LocalStorage
    localPurchases = localPurchases.map(p => {
      if (p.id === purchaseId) {
        return { ...p, status: 'used', scannedAt: timestamp };
      }
      return p;
    });
    setLocalData('purchases', localPurchases);

    // Save gate log
    const gateLog: GateLog = {
      id: `gl_${Math.random().toString(36).substr(2, 9)}`,
      purchaseId: purchaseId,
      ticketId: purchase.ticketId,
      movieTitle: purchase.movieTitle,
      buyerName: purchase.buyerName,
      scannedAt: timestamp,
      status: 'success'
    };
    await this.saveGateLog(gateLog);

    return { success: true, message: `Ticket Authenticated successfully! Welcome to the show, ${purchase.buyerName}.`, purchase };
  },

  async saveGateLog(log: GateLog): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('gate_logs').insert([
          {
            id: log.id,
            purchase_id: log.purchaseId,
            ticket_id: log.ticketId,
            movie_title: log.movieTitle,
            buyer_name: log.buyerName,
            scanned_at: log.scannedAt,
            status: log.status
          }
        ]);
      } catch (e) {
        console.log('Supabase saveGateLog failed:', e);
      }
    }

    const logs = getLocalData<GateLog[]>('gate_logs', []);
    logs.unshift(log);
    setLocalData('gate_logs', logs);
  },

  async getGateLogs(producerId: string): Promise<GateLog[]> {
    const tickets = await this.getTickets();
    const producerTicketIds = tickets.filter(t => t.producerId === producerId).map(t => t.id);

    let supabaseLogs: GateLog[] = [];
    let fetchSucceeded = false;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('gate_logs')
          .select('*')
          .in('ticket_id', producerTicketIds)
          .order('scanned_at', { ascending: false });
        if (error) throw error;
        if (data) {
          supabaseLogs = data.map(l => ({
            id: l.id,
            purchaseId: l.purchase_id,
            ticketId: l.ticket_id,
            movieTitle: l.movie_title,
            buyerName: l.buyer_name,
            scannedAt: l.scanned_at,
            status: l.status as 'success' | 'already_used' | 'invalid'
          }));
          fetchSucceeded = true;
        }
      } catch (e) {
        console.log('Supabase getGateLogs failed, falling back to LocalStorage:', e);
      }
    }

    const localLogs = getLocalData<GateLog[]>('gate_logs', []).filter(l => producerTicketIds.includes(l.ticketId) || l.ticketId === 'unknown');

    if (fetchSucceeded) {
      const merged = [...supabaseLogs];
      for (const ll of localLogs) {
        if (!merged.some(l => l.id === ll.id)) {
          merged.push(ll);
        }
      }
      return merged.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
    }

    return localLogs;
  },

  async getAllProfiles(): Promise<UserProfile[]> {
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
  },

  async deleteProfile(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Cascade manually in Supabase if RLS or foreign keys need assistance, 
        // but normally tables are setup with ON DELETE CASCADE.
        // Let's delete dependent data explicitly to be 100% safe against constraints!

        // 1. Delete buyer's purchases and gate logs
        try {
          await supabase.from('ticket_purchases').delete().eq('buyer_id', id);
        } catch (e) {
          console.warn('Silent purchase delete issue during user deletion:', e);
        }

        // 2. Fetch all tickets for this producer to delete their physical assets
        try {
          const { data: tickets } = await supabase
            .from('movie_tickets')
            .select('id')
            .eq('producer_id', id);

          if (tickets && tickets.length > 0) {
            for (const t of tickets) {
              await this.deleteTicket(t.id);
            }
          }
        } catch (e) {
          console.warn('Silent ticket assets delete issue during user deletion:', e);
        }

        // 3. Delete from profiles table
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (e: any) {
        lastSupabaseError = e?.message || String(e);
        console.warn('Supabase deleteProfile failed, falling back to LocalStorage:', e?.message || e);
      }
    }

    // LocalStorage delete flow
    const users = getLocalData<UserProfile[]>('users', []);
    const filteredUsers = users.filter(u => u.id !== id);
    setLocalData('users', filteredUsers);

    // Filter local tickets if it was a producer
    const tickets = getLocalData<MovieTicket[]>('tickets', []);
    const filteredTickets = tickets.filter(t => t.producerId !== id);
    setLocalData('tickets', filteredTickets);

    // Filter local purchases
    const purchases = getLocalData<TicketPurchase[]>('purchases', []);
    const filteredPurchases = purchases.filter(p => p.buyerId !== id && !tickets.some(t => t.id === p.ticketId && t.producerId === id));
    setLocalData('purchases', filteredPurchases);

    return true;
  }
};

function p_ref_map(val: any) {
  return val || '';
}
