import { MovieTicket } from '../../types';
import { 
  supabase, 
  isSupabaseConfigured, 
  setSupabaseLastError, 
  getLocalData, 
  setLocalData, 
  getDeletedTicketIds, 
  addDeletedTicketId, 
  removeDeletedTicketId, 
  notifyTicketsChanged 
} from './client';
import { DEFAULT_MOVIES } from './mockData';
import { logger } from '../logger';

export async function getTickets(): Promise<MovieTicket[]> {
  const deletedIds = getDeletedTicketIds();
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
        supabaseTickets = data
          .filter(m => !deletedIds.has(m.id))
          .map(m => {
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
      setSupabaseLastError(e?.message || String(e));
      logger.debug('Supabase getTickets failed, falling back to LocalStorage', 'tickets', { error: e?.message });
    }
  }

  const simulationsCleared = typeof window !== 'undefined' && window.localStorage && localStorage.getItem('mt_hub_simulations_cleared') === 'true';
  const defaultInitial = simulationsCleared ? [] : DEFAULT_MOVIES;
  const localTickets = getLocalData<MovieTicket[]>('tickets', defaultInitial);
  const uniqueLocalTicketsCleaned: MovieTicket[] = [];
  const seenTicketIds = new Set<string>();
  for (const t of localTickets) {
    if (t && t.id && !seenTicketIds.has(t.id) && !deletedIds.has(t.id)) {
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
    const merged = [...supabaseTickets];
    for (const localT of uniqueLocalTicketsCleaned) {
      if (localT.isLocalOnly && !deletedIds.has(localT.id) && !merged.some(t => t.id === localT.id)) {
        merged.push(localT);
      }
    }
    const sorted = merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setLocalData('tickets', sorted);
    return sorted;
  }

  const finalLocalList = uniqueLocalTicketsCleaned
    .filter(t => !deletedIds.has(t.id))
    .map(t => ({ ...t, isLocalOnly: true }));
  setLocalData('tickets', finalLocalList);
  return finalLocalList;
}

export async function createTicket(ticket: MovieTicket): Promise<MovieTicket> {
  removeDeletedTicketId(ticket.id);
  const descriptionWithCat = ticket.description + `\n<!--CAT:${ticket.category || 'movie'}-->`;
  let isSyncedToSupabase = false;

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
      isSyncedToSupabase = true;
    } catch (e: any) {
      setSupabaseLastError(e?.message || String(e));
      logger.debug('Supabase createTicket failed, falling back to LocalStorage', 'tickets', { error: e?.message });
    }
  }

  const tickets = getLocalData<MovieTicket[]>('tickets', []);
  const localSavedTicket = {
    ...ticket,
    description: descriptionWithCat,
    isLocalOnly: !isSyncedToSupabase
  };
  tickets.unshift(localSavedTicket);
  setLocalData('tickets', tickets);
  notifyTicketsChanged();
  return ticket;
}

export async function deleteTicket(id: string, skipNotification = false): Promise<boolean> {
  addDeletedTicketId(id);

  const tickets = getLocalData<MovieTicket[]>('tickets', []);
  const filtered = tickets.filter(t => t.id !== id);
  setLocalData('tickets', filtered);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: ticket } = await supabase
        .from('movie_tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (ticket) {
        const filesToDelete: string[] = [];

        const getStoragePathFromUrl = (url: string, bucketName: string = 'producers-assets'): string | null => {
          if (!url || url.startsWith('data:')) return null;

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
          try {
            await supabase.storage.from('producers-assets').remove(filesToDelete);
          } catch (storageErr) {
            logger.debug('Storage removal non-blocking error', 'tickets', { storageErr });
          }
        }
      }

      try {
        await supabase.from('gate_logs').delete().eq('ticket_id', id);
      } catch (dbErr) {
        logger.debug('Non-blocking gate_logs deletion error', 'tickets', { dbErr });
      }

      try {
        await supabase.from('ticket_purchases').delete().eq('ticket_id', id);
      } catch (dbErr) {
        logger.debug('Non-blocking ticket_purchases deletion error', 'tickets', { dbErr });
      }

      const { error } = await supabase
        .from('movie_tickets')
        .delete()
        .eq('id', id);
      if (error) {
        throw error;
      }
    } catch (e: any) {
      setSupabaseLastError(e?.message || String(e));
      logger.warn('Supabase deleteTicket failed, falling back to LocalStorage', 'tickets', { error: e?.message || e });
    }
  }

  if (!skipNotification) {
    notifyTicketsChanged();
  }
  return true;
}

export async function clearAllTickets(): Promise<boolean> {
  const localTickets = getLocalData<MovieTicket[]>('tickets', []);
  localTickets.forEach(t => addDeletedTicketId(t.id));
  DEFAULT_MOVIES.forEach(m => addDeletedTicketId(m.id));

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('mt_hub_simulations_cleared', 'true');
  }

  if (isSupabaseConfigured && supabase) {
    try {
      try {
        await supabase.from('gate_logs').delete().neq('id', '_dummy_');
      } catch (e) {
        logger.debug('Non-blocking gate_logs clear error', 'tickets', { error: e });
      }
      try {
        await supabase.from('ticket_purchases').delete().neq('id', '_dummy_');
      } catch (e) {
        logger.debug('Non-blocking ticket_purchases clear error', 'tickets', { error: e });
      }

      const { error } = await supabase
        .from('movie_tickets')
        .delete()
        .neq('id', '_dummy_id_not_used_');
      if (error) throw error;
    } catch (e: any) {
      setSupabaseLastError(e?.message || String(e));
      logger.warn('Supabase clearAllTickets failed, falling back to LocalStorage', 'tickets', { error: e?.message || e });
    }
  }

  setLocalData('tickets', []);
  setLocalData('purchases', []);
  setLocalData('gate_logs', []);
  notifyTicketsChanged();
  return true;
}
