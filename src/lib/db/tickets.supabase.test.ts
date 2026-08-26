import { describe, it, expect } from 'vitest';
import {
  getStoragePathFromUrl,
  supabaseGetTickets,
  supabaseInsertTicket,
  supabaseDeleteTicket,
  supabaseClearAllTickets,
} from './tickets.supabase';

describe('Supabase Tickets Layer (Storage path & fallback operations)', () => {
  it('correctly parses Supabase storage URLs into paths', () => {
    const directUrl =
      'https://xyz.supabase.co/storage/v1/object/public/producers-assets/covers/usr-1/movie.jpg';
    expect(getStoragePathFromUrl(directUrl)).toBe('covers/usr-1/movie.jpg');

    const withQuery =
      'https://xyz.supabase.co/storage/v1/object/public/producers-assets/trailers/video.mp4?token=123#hash';
    expect(getStoragePathFromUrl(withQuery)).toBe('trailers/video.mp4');

    expect(getStoragePathFromUrl('data:image/png;base64,123')).toBeNull();
    expect(getStoragePathFromUrl('')).toBeNull();
  });

  it('handles safe stub calls without throwing unexpected fatal errors', async () => {
    const tickets = await supabaseGetTickets();
    expect(Array.isArray(tickets)).toBe(true);

    await expect(
      supabaseInsertTicket(
        {
          id: 'tkt-test-sub',
          title: 'Title',
          description: 'Desc',
          price: 10,
          date: '2026-08-30',
          time: '18:00',
          venue: 'Accra',
          trailerUrl: 'https://example.com/trailer.mp4',
          producerId: 'usr-1',
          producerName: 'Name',
          totalQuantity: 10,
          availableQuantity: 10,
          coverUrl: 'https://example.com/cover.jpg',
          createdAt: new Date().toISOString(),
        },
        'Desc\n<!--CAT:movie-->'
      )
    ).resolves.not.toThrow();

    await expect(supabaseDeleteTicket('tkt-test-sub')).resolves.not.toThrow();
    await expect(supabaseClearAllTickets()).resolves.not.toThrow();
  });
});
