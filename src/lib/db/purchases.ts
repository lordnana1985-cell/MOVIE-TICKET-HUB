import { TicketPurchase, GateLog, MovieTicket, UserProfile } from '../../types';
import { getLocalData, setLocalData, notifyTicketsChanged } from './client';
import { getTickets } from './tickets';
import { logger } from '../logger';
import { DbError } from './errors';
import {
  supabaseInsertPurchase,
  supabaseGetPurchasesForBuyer,
  supabaseGetPurchasesForProducer,
  supabaseInsertGateLog,
  supabaseGetPurchaseById,
  supabaseUpdatePurchaseStatus,
  supabaseGetGateLogs,
} from './purchases.supabase';

export async function purchaseTicket(purchase: TicketPurchase): Promise<TicketPurchase> {
  try {
    await supabaseInsertPurchase(purchase);
  } catch (e: unknown) {
    const dbErr = DbError.fromError('purchaseTicket', e, true);
    logger.error(
      'Supabase purchase transaction write failed, falling back to LocalStorage',
      'purchases',
      {
        error: dbErr.message,
      }
    );
  }

  const purchases = getLocalData<TicketPurchase[]>('purchases', []);
  purchases.unshift(purchase);
  setLocalData('purchases', purchases);

  const tickets = getLocalData<MovieTicket[]>('tickets', []);
  const updatedTickets = tickets.map((t) => {
    if (t.id === purchase.ticketId) {
      return { ...t, availableQuantity: Math.max(0, t.availableQuantity - 1) };
    }
    return t;
  });
  setLocalData('tickets', updatedTickets);

  const foundTicket = tickets.find((t) => t.id === purchase.ticketId);
  if (foundTicket) {
    const users = getLocalData<UserProfile[]>('users', []);
    const updatedUsers = users.map((u) => {
      if (u.id === foundTicket.producerId) {
        return { ...u, balance: (u.balance || 0) + purchase.producerEarning };
      }
      return u;
    });
    setLocalData('users', updatedUsers);
  }

  notifyTicketsChanged();
  return purchase;
}

export async function getPurchasesForBuyer(buyerId: string): Promise<TicketPurchase[]> {
  let supabasePurchases: TicketPurchase[] = [];
  try {
    supabasePurchases = await supabaseGetPurchasesForBuyer(buyerId);
  } catch (e: unknown) {
    const dbErr = DbError.fromError('getPurchasesForBuyer', e, true);
    logger.warn('Supabase getPurchasesForBuyer failed, falling back to LocalStorage', 'purchases', {
      error: dbErr.message,
    });
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

  const localPurchases = uniqueLocalPurchases.filter((p) => p.buyerId === buyerId);
  if (supabasePurchases.length > 0) {
    const merged = [...supabasePurchases];
    for (const lp of localPurchases) {
      if (!merged.some((p) => p.id === lp.id)) merged.push(lp);
    }
    return merged.sort(
      (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    );
  }

  return localPurchases;
}

export async function getPurchasesForProducer(producerId: string): Promise<TicketPurchase[]> {
  const tickets = await getTickets();
  const producerTicketIds = tickets.filter((t) => t.producerId === producerId).map((t) => t.id);

  let supabasePurchases: TicketPurchase[] = [];
  try {
    supabasePurchases = await supabaseGetPurchasesForProducer(producerTicketIds);
  } catch (e: unknown) {
    const dbErr = DbError.fromError('getPurchasesForProducer', e, true);
    logger.warn(
      'Supabase getPurchasesForProducer failed, falling back to LocalStorage',
      'purchases',
      { error: dbErr.message }
    );
  }

  const rawLocalPurchases = getLocalData<TicketPurchase[]>('purchases', []);
  const localPurchases = rawLocalPurchases.filter((p) => producerTicketIds.includes(p.ticketId));

  if (supabasePurchases.length > 0) {
    const merged = [...supabasePurchases];
    for (const lp of localPurchases) {
      if (!merged.some((p) => p.id === lp.id)) merged.push(lp);
    }
    return merged.sort(
      (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    );
  }

  return localPurchases;
}

export async function saveGateLog(log: GateLog): Promise<void> {
  try {
    await supabaseInsertGateLog(log);
  } catch (e: unknown) {
    const dbErr = DbError.fromError('saveGateLog', e, true);
    logger.warn('Supabase saveGateLog write failed, falling back to LocalStorage', 'purchases', {
      error: dbErr.message,
    });
  }

  const logs = getLocalData<GateLog[]>('gate_logs', []);
  logs.unshift(log);
  setLocalData('gate_logs', logs);
}

export async function authenticateTicket(
  purchaseId: string
): Promise<{ success: boolean; message: string; purchase?: TicketPurchase }> {
  const timestamp = new Date().toISOString();
  let purchase: TicketPurchase | undefined;
  let localPurchases = getLocalData<TicketPurchase[]>('purchases', []);

  try {
    const remotePurchase = await supabaseGetPurchaseById(purchaseId);
    if (remotePurchase) purchase = remotePurchase;
  } catch (e: unknown) {
    const dbErr = DbError.fromError('authenticateTicket', e, true);
    logger.warn('Supabase check before auth failed, falling back to LocalStorage', 'purchases', {
      error: dbErr.message,
    });
  }

  if (!purchase) {
    purchase = localPurchases.find((p) => p.id === purchaseId);
  }

  if (!purchase) {
    const gateLog: GateLog = {
      id: `gl_${Math.random().toString(36).substring(2, 11)}`,
      purchaseId,
      ticketId: 'unknown',
      movieTitle: 'Unknown Movie',
      buyerName: 'Unknown Ticket Holder',
      scannedAt: timestamp,
      status: 'invalid',
    };
    await saveGateLog(gateLog);
    return {
      success: false,
      message: 'Invalid ticket reference! This ticket does not exist in our system.',
    };
  }

  if (purchase.status === 'used') {
    const gateLog: GateLog = {
      id: `gl_${Math.random().toString(36).substring(2, 11)}`,
      purchaseId,
      ticketId: purchase.ticketId,
      movieTitle: purchase.movieTitle,
      buyerName: purchase.buyerName,
      scannedAt: timestamp,
      status: 'already_used',
    };
    await saveGateLog(gateLog);
    return {
      success: false,
      message: `Ticket already USED! It was authenticated on ${new Date(purchase.scannedAt || '').toLocaleString()}`,
      purchase,
    };
  }

  purchase.status = 'used';
  purchase.scannedAt = timestamp;

  try {
    await supabaseUpdatePurchaseStatus(purchaseId, 'used', timestamp);
  } catch (e: unknown) {
    const dbErr = DbError.fromError('authenticateTicketUpdate', e, true);
    logger.warn('Supabase update ticket status failed, updated local storage', 'purchases', {
      error: dbErr.message,
    });
  }

  localPurchases = localPurchases.map((p) => {
    if (p.id === purchaseId) {
      return { ...p, status: 'used', scannedAt: timestamp };
    }
    return p;
  });
  setLocalData('purchases', localPurchases);

  const gateLog: GateLog = {
    id: `gl_${Math.random().toString(36).substring(2, 11)}`,
    purchaseId,
    ticketId: purchase.ticketId,
    movieTitle: purchase.movieTitle,
    buyerName: purchase.buyerName,
    scannedAt: timestamp,
    status: 'success',
  };
  await saveGateLog(gateLog);

  return {
    success: true,
    message: `Ticket Authenticated successfully! Welcome to the show, ${purchase.buyerName}.`,
    purchase,
  };
}

export async function getGateLogs(producerId?: string): Promise<GateLog[]> {
  const tickets = await getTickets();
  const producerTicketIds = producerId
    ? tickets.filter((t) => t.producerId === producerId).map((t) => t.id)
    : null;

  let supabaseLogs: GateLog[] = [];
  try {
    supabaseLogs = await supabaseGetGateLogs(producerTicketIds);
  } catch (e: unknown) {
    const dbErr = DbError.fromError('getGateLogs', e, true);
    logger.warn('Supabase getGateLogs failed, falling back to LocalStorage', 'purchases', {
      error: dbErr.message,
    });
  }

  const rawLocalLogs = getLocalData<GateLog[]>('gate_logs', []);
  const localLogs = producerTicketIds
    ? rawLocalLogs.filter((l) => producerTicketIds.includes(l.ticketId) || l.ticketId === 'unknown')
    : rawLocalLogs;

  if (supabaseLogs.length > 0) {
    const merged = [...supabaseLogs];
    for (const ll of localLogs) {
      if (!merged.some((l) => l.id === ll.id)) merged.push(ll);
    }
    return merged.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  }

  return localLogs;
}
