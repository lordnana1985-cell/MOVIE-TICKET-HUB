import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, MovieTicket } from '../../types';
import { DEFAULT_MOVIES, DEFAULT_USERS, DEFAULT_PURCHASES } from './mockData';

const env = (import.meta as any).env || {};
export const SUPABASE_URL = env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase configuration. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are configured."
  );
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: false,
  }
});
export const isSupabaseConfigured = true;
let lastSupabaseError: string | null = null;

export const getSupabaseLastError = () => lastSupabaseError;
export const setSupabaseLastError = (err: string | null) => { lastSupabaseError = err; };
export const clearSupabaseLastError = () => { lastSupabaseError = null; };

export const getSupabaseStatus = () => {
  return {
    configured: isSupabaseConfigured,
    url: SUPABASE_URL,
    hasKey: !!SUPABASE_ANON_KEY
  };
};

// HELPER FOR LOCALSTORAGE FALLBACKS
export const getLocalData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultValue;
  }
  const data = localStorage.getItem(`mt_hub_${key}`);
  return data ? JSON.parse(data) : defaultValue;
};

export const setLocalData = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  localStorage.setItem(`mt_hub_${key}`, JSON.stringify(data));
};

// TOMBSTONE HELPERS FOR PERSISTENT GLOBAL DELETIONS
export const getDeletedTicketIds = (): Set<string> => {
  const list = getLocalData<string[]>('deleted_ticket_ids', []);
  return new Set(list);
};

export const addDeletedTicketId = (id: string): void => {
  const ids = getLocalData<string[]>('deleted_ticket_ids', []);
  if (!ids.includes(id)) {
    ids.push(id);
    setLocalData('deleted_ticket_ids', ids);
  }
};

export const removeDeletedTicketId = (id: string): void => {
  const ids = getLocalData<string[]>('deleted_ticket_ids', []);
  const filtered = ids.filter(i => i !== id);
  setLocalData('deleted_ticket_ids', filtered);
};

// CROSS-TAB & GLOBAL BROADCAST EVENT HELPER
export const globalChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mt_hub_events') : null;

if (globalChannel) {
  globalChannel.onmessage = (event) => {
    if (event.data && event.data.type === 'mt_hub_tickets_changed') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mt_hub_tickets_changed'));
      }
    }
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'mt_hub_tickets_changed_ts' || e.key === 'mt_hub_tickets') {
      window.dispatchEvent(new CustomEvent('mt_hub_tickets_changed'));
    }
  });
}

let notifyDebounceTimer: any = null;
let lastNotificationTimestamp = 0;

export const notifyTicketsChanged = () => {
  const now = Date.now();
  if (now - lastNotificationTimestamp < 300) {
    if (!notifyDebounceTimer) {
      notifyDebounceTimer = setTimeout(() => {
        notifyDebounceTimer = null;
        lastNotificationTimestamp = Date.now();
        dispatchGlobalChange();
      }, 300);
    }
    return;
  }

  lastNotificationTimestamp = now;
  dispatchGlobalChange();
};

function dispatchGlobalChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mt_hub_tickets_changed'));
    try {
      localStorage.setItem('mt_hub_tickets_changed_ts', Date.now().toString());
    } catch (e) {}
  }
  if (globalChannel) {
    try {
      globalChannel.postMessage({ type: 'mt_hub_tickets_changed', timestamp: Date.now() });
    } catch (e) {}
  }
}

// SUBSCRIBE TO SUPABASE REALTIME CHANGES
if (isSupabaseConfigured && supabase) {
  try {
    supabase
      .channel('public:movie_tickets_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'movie_tickets' },
        (payload) => {
          console.log('Realtime movie_tickets event received:', payload.eventType, payload);
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              addDeletedTicketId(deletedId);
              const tickets = getLocalData<MovieTicket[]>('tickets', []);
              const filtered = tickets.filter(t => t.id !== deletedId);
              setLocalData('tickets', filtered);
            }
          }
          notifyTicketsChanged();
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('Failed to subscribe to Supabase Realtime channel:', err);
  }
}

// INITIALIZE LOCAL DB IF EMPTY
if (typeof window !== 'undefined' && window.localStorage) {
  const isCleared = localStorage.getItem('mt_hub_simulations_cleared') === 'true';
  const deletedTicketIdsOnBoot = getDeletedTicketIds();

  if (!localStorage.getItem('mt_hub_tickets')) {
    const initialFilteredMovies = DEFAULT_MOVIES.filter(m => !deletedTicketIdsOnBoot.has(m.id));
    setLocalData('tickets', isCleared ? [] : initialFilteredMovies);
  }

  if (!localStorage.getItem('mt_hub_users')) {
    setLocalData('users', isCleared ? [] : DEFAULT_USERS);
  } else {
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
    setLocalData('purchases', isCleared ? [] : DEFAULT_PURCHASES);
  }
  if (!localStorage.getItem('mt_hub_gate_logs')) {
    setLocalData('gate_logs', []);
  }
}

export async function uploadFile(
  bucketName: string,
  filePath: string,
  file: File,
  allowFallback = true,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    try {
      try {
        await supabase.storage.createBucket(bucketName, { public: true });
      } catch (bErr) {
        console.log('Bucket check / create result:', bErr);
      }

      const { data: _data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'video/mp4',
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
      setSupabaseLastError(e?.message || String(e));
      console.warn('Supabase storage upload failed:', e);

      if (!allowFallback) {
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
}

export function clearAllSimulations(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.setItem('mt_hub_simulations_cleared', 'true');
  localStorage.setItem('mt_hub_tickets', JSON.stringify([]));
  localStorage.setItem('mt_hub_users', JSON.stringify([]));
  localStorage.setItem('mt_hub_purchases', JSON.stringify([]));
  localStorage.setItem('mt_hub_gate_logs', JSON.stringify([]));
  localStorage.removeItem('mt_hub_current_user');
}
