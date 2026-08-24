import { TicketPurchase, GateLog, MovieTicket, UserProfile } from '../../types';
import { 
  supabase, 
  isSupabaseConfigured, 
  getLocalData, 
  setLocalData, 
  notifyTicketsChanged 
} from './client';
import { getTickets } from './tickets';
import { logger } from '../logger';
import { DbError } from './errors';

function p_ref_map(val: any) {
  return val || '';
}

export async function purchaseTicket(purchase: TicketPurchase): Promise<TicketPurchase> {
  if (isSupabaseConfigured && supabase) {
    try {
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
    } catch (e: unknown) {
      const dbErr = DbError.fromError('purchaseTicket', e, true);
      logger.debug('Supabase purchase transaction failed, falling back to LocalStorage', 'purchases', { error: dbErr.message });
    }
  }

  const purchases = getLocalData<TicketPurchase[]>('purchases', []);
  purchases.unshift(purchase);
  setLocalData('purchases', purchases);

  const tickets = getLocalData<MovieTicket[]>('tickets', []);
  const updatedTickets = tickets.map(t => {
    if (t.id === purchase.ticketId) {
      return { ...t, availableQuantity: Math.max(0, t.availableQuantity - 1) };
    }
    return t;
  });
  setLocalData('tickets', updatedTickets);

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

  notifyTicketsChanged();
  return purchase;
}

export async function getPurchasesForBuyer(buyerId: string): Promise<TicketPurchase[]> {
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
    } catch (e: unknown) {
      const dbErr = DbError.fromError('getPurchasesForBuyer', e, true);
      logger.debug('Supabase getPurchasesForBuyer failed, falling back to LocalStorage', 'purchases', { error: dbErr.message });
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
}

export async function getPurchasesForProducer(producerId: string): Promise<TicketPurchase[]> {
  const tickets = await getTickets();
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
    } catch (e: unknown) {
      const dbErr = DbError.fromError('getPurchasesForProducer', e, true);
      logger.debug('Supabase getPurchasesForProducer failed, falling back to LocalStorage', 'purchases', { error: dbErr.message });
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
}

export async function saveGateLog(log: GateLog): Promise<void> {
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
    } catch (e: unknown) {
      const dbErr = DbError.fromError('saveGateLog', e, true);
      logger.debug('Supabase saveGateLog failed', 'purchases', { error: dbErr.message });
    }
  }

  const logs = getLocalData<GateLog[]>('gate_logs', []);
  logs.unshift(log);
  setLocalData('gate_logs', logs);
}

export async function authenticateTicket(purchaseId: string): Promise<{ success: boolean; message: string; purchase?: TicketPurchase }> {
  const timestamp = new Date().toISOString();
  
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
        logger.debug('Ticket not found in Supabase during auth scan', 'purchases', { error: error.message });
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
    } catch (e: unknown) {
      const dbErr = DbError.fromError('authenticateTicket', e, true);
      logger.debug('Supabase check before auth failed, falling back to LocalStorage', 'purchases', { error: dbErr.message });
    }
  }

  if (!purchase) {
    purchase = localPurchases.find(p => p.id === purchaseId);
  }

  if (!purchase) {
    const gateLog: GateLog = {
      id: `gl_${Math.random().toString(36).substring(2, 11)}`,
      purchaseId: purchaseId,
      ticketId: 'unknown',
      movieTitle: 'Unknown Movie',
      buyerName: 'Unknown Ticket Holder',
      scannedAt: timestamp,
      status: 'invalid'
    };
    await saveGateLog(gateLog);
    return { success: false, message: 'Invalid ticket reference! This ticket does not exist in our system.' };
  }

  if (purchase.status === 'used') {
    const gateLog: GateLog = {
      id: `gl_${Math.random().toString(36).substring(2, 11)}`,
      purchaseId: purchaseId,
      ticketId: purchase.ticketId,
      movieTitle: purchase.movieTitle,
      buyerName: purchase.buyerName,
      scannedAt: timestamp,
      status: 'already_used'
    };
    await saveGateLog(gateLog);
    return { success: false, message: `Ticket already USED! It was authenticated on ${new Date(purchase.scannedAt || '').toLocaleString()}`, purchase };
  }

  purchase.status = 'used';
  purchase.scannedAt = timestamp;

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('ticket_purchases')
        .update({ status: 'used', scanned_at: timestamp })
        .eq('id', purchaseId);
    } catch (e: unknown) {
      const dbErr = DbError.fromError('authenticateTicketUpdate', e, true);
      logger.debug('Supabase update ticket status failed', 'purchases', { error: dbErr.message });
    }
  }

  localPurchases = localPurchases.map(p => {
    if (p.id === purchaseId) {
      return { ...p, status: 'used', scannedAt: timestamp };
    }
    return p;
  });
  setLocalData('purchases', localPurchases);

  const gateLog: GateLog = {
    id: `gl_${Math.random().toString(36).substring(2, 11)}`,
    purchaseId: purchaseId,
    ticketId: purchase.ticketId,
    movieTitle: purchase.movieTitle,
    buyerName: purchase.buyerName,
    scannedAt: timestamp,
    status: 'success'
  };
  await saveGateLog(gateLog);

  return { success: true, message: `Ticket Authenticated successfully! Welcome to the show, ${purchase.buyerName}.`, purchase };
}

export async function getGateLogs(producerId?: string): Promise<GateLog[]> {
  const tickets = await getTickets();
  const producerTicketIds = producerId ? tickets.filter(t => t.producerId === producerId).map(t => t.id) : null;

  let supabaseLogs: GateLog[] = [];
  let fetchSucceeded = false;

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('gate_logs').select('*');
      if (producerTicketIds) {
        query = query.in('ticket_id', producerTicketIds);
      }
      const { data, error } = await query.order('scanned_at', { ascending: false });
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
    } catch (e: unknown) {
      const dbErr = DbError.fromError('getGateLogs', e, true);
      logger.debug('Supabase getGateLogs failed, falling back to LocalStorage', 'purchases', { error: dbErr.message });
    }
  }

  const rawLocalLogs = getLocalData<GateLog[]>('gate_logs', []);
  const localLogs = producerTicketIds 
    ? rawLocalLogs.filter(l => producerTicketIds.includes(l.ticketId) || l.ticketId === 'unknown')
    : rawLocalLogs;

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
}
