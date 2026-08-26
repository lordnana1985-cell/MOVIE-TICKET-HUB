import { MovieTicket } from '../../types';
import {
  setSupabaseLastError,
  getLocalData,
  setLocalData,
  getDeletedTicketIds,
  addDeletedTicketId,
  removeDeletedTicketId,
  notifyTicketsChanged,
} from './client';
import { DEFAULT_MOVIES } from './mockData';
import { logger } from '../logger';
import { DbError } from './errors';
import {
  supabaseGetTickets,
  supabaseInsertTicket,
  supabaseDeleteTicket,
  supabaseClearAllTickets,
} from './tickets.supabase';

export async function getTickets(): Promise<MovieTicket[]> {
  const deletedIds = getDeletedTicketIds();
  let supabaseTickets: MovieTicket[] = [];
  let fetchSucceeded = false;

  try {
    const remote = await supabaseGetTickets();
    if (remote.length > 0) {
      supabaseTickets = remote.filter((m) => !deletedIds.has(m.id));
      fetchSucceeded = true;
    }
  } catch (e: unknown) {
    const dbErr = DbError.fromError('getTickets', e, true);
    setSupabaseLastError(dbErr.message);
    logger.warn('Supabase getTickets failed, falling back to LocalStorage', 'tickets', {
      error: dbErr.message,
    });
  }

  const simulationsCleared =
    typeof window !== 'undefined' &&
    window.localStorage &&
    localStorage.getItem('mt_hub_simulations_cleared') === 'true';
  const defaultInitial = simulationsCleared ? [] : DEFAULT_MOVIES;
  const localTickets = getLocalData<MovieTicket[]>('tickets', defaultInitial);
  const uniqueLocalTicketsCleaned: MovieTicket[] = [];
  const seenTicketIds = new Set<string>();

  for (const t of localTickets) {
    if (t && t.id && !seenTicketIds.has(t.id) && !deletedIds.has(t.id)) {
      seenTicketIds.add(t.id);
      const catMatch = t.description ? t.description.match(/<!--CAT:(\w+)-->/) : null;
      const category = t.category || (catMatch ? catMatch[1] : 'movie');
      const cleanDescription = t.description
        ? t.description.replace(/<!--CAT:\w+-->/, '').trim()
        : t.description || '';
      uniqueLocalTicketsCleaned.push({
        ...t,
        description: cleanDescription,
        category: category as any,
      });
    }
  }
  if (uniqueLocalTicketsCleaned.length !== localTickets.length) {
    setLocalData('tickets', uniqueLocalTicketsCleaned);
  }

  if (fetchSucceeded) {
    const merged = [...supabaseTickets];
    for (const localT of uniqueLocalTicketsCleaned) {
      if (
        localT.isLocalOnly &&
        !deletedIds.has(localT.id) &&
        !merged.some((t) => t.id === localT.id)
      ) {
        merged.push(localT);
      }
    }
    const sorted = merged.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setLocalData('tickets', sorted);
    return sorted;
  }

  const finalLocalList = uniqueLocalTicketsCleaned
    .filter((t) => !deletedIds.has(t.id))
    .map((t) => ({ ...t, isLocalOnly: true }));
  setLocalData('tickets', finalLocalList);
  return finalLocalList;
}

export async function createTicket(ticket: MovieTicket): Promise<MovieTicket> {
  removeDeletedTicketId(ticket.id);
  const descriptionWithCat = ticket.description + `\n<!--CAT:${ticket.category || 'movie'}-->`;
  let isSyncedToSupabase = false;

  try {
    await supabaseInsertTicket(ticket, descriptionWithCat);
    isSyncedToSupabase = true;
  } catch (e: unknown) {
    const dbErr = DbError.fromError('createTicket', e, true);
    setSupabaseLastError(dbErr.message);
    logger.error('Supabase createTicket write failed, saved to LocalStorage', 'tickets', {
      error: dbErr.message,
    });
  }

  const tickets = getLocalData<MovieTicket[]>('tickets', []);
  const localSavedTicket = {
    ...ticket,
    description: descriptionWithCat,
    isLocalOnly: !isSyncedToSupabase,
  };
  tickets.unshift(localSavedTicket);
  setLocalData('tickets', tickets);
  notifyTicketsChanged();
  return ticket;
}

export async function deleteTicket(id: string, skipNotification = false): Promise<boolean> {
  addDeletedTicketId(id);

  const tickets = getLocalData<MovieTicket[]>('tickets', []);
  const filtered = tickets.filter((t) => t.id !== id);
  setLocalData('tickets', filtered);

  try {
    await supabaseDeleteTicket(id);
  } catch (e: unknown) {
    const dbErr = DbError.fromError('deleteTicket', e, true);
    setSupabaseLastError(dbErr.message);
    logger.warn('Supabase deleteTicket failed, falling back to LocalStorage', 'tickets', {
      error: dbErr.message,
    });
  }

  if (!skipNotification) {
    notifyTicketsChanged();
  }
  return true;
}

export async function clearAllTickets(): Promise<boolean> {
  const localTickets = getLocalData<MovieTicket[]>('tickets', []);
  localTickets.forEach((t) => addDeletedTicketId(t.id));
  DEFAULT_MOVIES.forEach((m) => addDeletedTicketId(m.id));

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('mt_hub_simulations_cleared', 'true');
  }

  try {
    await supabaseClearAllTickets();
  } catch (e: unknown) {
    const dbErr = DbError.fromError('clearAllTickets', e, true);
    setSupabaseLastError(dbErr.message);
    logger.warn('Supabase clearAllTickets failed, falling back to LocalStorage', 'tickets', {
      error: dbErr.message,
    });
  }

  setLocalData('tickets', []);
  setLocalData('purchases', []);
  setLocalData('gate_logs', []);
  notifyTicketsChanged();
  return true;
}
