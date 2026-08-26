import { TicketPurchase, GateLog } from '../../types';
import { supabase, isSupabaseConfigured } from './client';

export async function supabaseInsertPurchase(purchase: TicketPurchase): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
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
      status: purchase.status,
    },
  ]);
  if (purchaseErr) throw purchaseErr;

  const { data: ticket } = await supabase
    .from('movie_tickets')
    .select('available_quantity, producer_id')
    .eq('id', purchase.ticketId)
    .single();

  if (ticket) {
    const newQty = Math.max(0, Number(ticket.available_quantity) - 1);
    await supabase
      .from('movie_tickets')
      .update({ available_quantity: newQty })
      .eq('id', purchase.ticketId);

    if (ticket.producer_id) {
      const { data: producer } = await supabase
        .from('profiles')
        .select('balance, id')
        .eq('id', ticket.producer_id)
        .single();

      if (producer) {
        const newBal = Number(producer.balance || 0) + purchase.producerEarning;
        await supabase.from('profiles').update({ balance: newBal }).eq('id', producer.id);
      }
    }
  }
}

export async function supabaseGetPurchasesForBuyer(buyerId: string): Promise<TicketPurchase[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('ticket_purchases')
    .select('*')
    .eq('buyer_id', buyerId)
    .order('purchased_at', { ascending: false });
  if (error) throw error;
  if (data) {
    return data.map((p) => ({
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
      paystackRef: p.paystack_ref || '',
      purchasedAt: p.purchased_at,
      status: p.status as 'unused' | 'used',
      scannedAt: p.scanned_at,
    }));
  }
  return [];
}

export async function supabaseGetPurchasesForProducer(
  ticketIds: string[]
): Promise<TicketPurchase[]> {
  if (!isSupabaseConfigured || !supabase || ticketIds.length === 0) return [];
  const { data, error } = await supabase
    .from('ticket_purchases')
    .select('*')
    .in('ticket_id', ticketIds)
    .order('purchased_at', { ascending: false });
  if (error) throw error;
  if (data) {
    return data.map((p) => ({
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
      paystackRef: p.paystack_ref || '',
      purchasedAt: p.purchased_at,
      status: p.status as 'unused' | 'used',
      scannedAt: p.scanned_at,
    }));
  }
  return [];
}

export async function supabaseInsertGateLog(log: GateLog): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('gate_logs').insert([
    {
      id: log.id,
      purchase_id: log.purchaseId,
      ticket_id: log.ticketId,
      movie_title: log.movieTitle,
      buyer_name: log.buyerName,
      scanned_at: log.scannedAt,
      status: log.status,
    },
  ]);
  if (error) throw error;
}

export async function supabaseGetPurchaseById(purchaseId: string): Promise<TicketPurchase | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from('ticket_purchases')
    .select('*')
    .eq('id', purchaseId)
    .single();
  if (error) return null;
  if (data) {
    return {
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
      paystackRef: data.paystack_ref || '',
      purchasedAt: data.purchased_at,
      status: data.status as 'unused' | 'used',
      scannedAt: data.scanned_at,
    };
  }
  return null;
}

export async function supabaseUpdatePurchaseStatus(
  purchaseId: string,
  status: 'unused' | 'used',
  scannedAt: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase
    .from('ticket_purchases')
    .update({ status, scanned_at: scannedAt })
    .eq('id', purchaseId);
  if (error) throw error;
}

export async function supabaseGetGateLogs(producerTicketIds?: string[] | null): Promise<GateLog[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  let query = supabase.from('gate_logs').select('*');
  if (producerTicketIds && producerTicketIds.length > 0) {
    query = query.in('ticket_id', producerTicketIds);
  }
  const { data, error } = await query.order('scanned_at', { ascending: false });
  if (error) throw error;
  if (data) {
    return data.map((l) => ({
      id: l.id,
      purchaseId: l.purchase_id,
      ticketId: l.ticket_id,
      movieTitle: l.movie_title,
      buyerName: l.buyer_name,
      scannedAt: l.scanned_at,
      status: l.status as 'success' | 'already_used' | 'invalid',
    }));
  }
  return [];
}
