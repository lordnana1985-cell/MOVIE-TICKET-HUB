import { MovieTicket } from '../../types';
import { supabase, isSupabaseConfigured } from './client';

export function getStoragePathFromUrl(
  url: string,
  bucketName: string = 'producers-assets'
): string | null {
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
}

export async function supabaseGetTickets(): Promise<MovieTicket[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('movie_tickets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (data) {
    return data.map((m) => {
      const catMatch = m.description ? m.description.match(/<!--CAT:(\w+)-->/) : null;
      const category = catMatch ? catMatch[1] : 'movie';
      const cleanDescription = m.description
        ? m.description.replace(/<!--CAT:\w+-->/, '').trim()
        : m.description || '';
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
        isLocalOnly: false,
      };
    });
  }
  return [];
}

export async function supabaseInsertTicket(
  ticket: MovieTicket,
  descriptionWithCat: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
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
      created_at: ticket.createdAt,
    },
  ]);
  if (error) throw error;
}

export async function supabaseDeleteTicket(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { data: ticket } = await supabase.from('movie_tickets').select('*').eq('id', id).single();

  if (ticket) {
    const filesToDelete: string[] = [];
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
      } catch {
        // Non-blocking asset removal
      }
    }
  }

  try {
    await supabase.from('gate_logs').delete().eq('ticket_id', id);
  } catch {
    // Non-blocking
  }

  try {
    await supabase.from('ticket_purchases').delete().eq('ticket_id', id);
  } catch {
    // Non-blocking
  }

  const { error } = await supabase.from('movie_tickets').delete().eq('id', id);
  if (error) throw error;
}

export async function supabaseClearAllTickets(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('gate_logs').delete().neq('id', '_dummy_');
  } catch {
    // Non-blocking
  }
  try {
    await supabase.from('ticket_purchases').delete().neq('id', '_dummy_');
  } catch {
    // Non-blocking
  }
  const { error } = await supabase.from('movie_tickets').delete().neq('id', '_dummy_id_not_used_');
  if (error) throw error;
}
