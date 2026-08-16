import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTickets, createTicket, deleteTicket, clearAllTickets } from '../lib/db/tickets';
import { MovieTicket } from '../types';

describe('tickets db module', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const sampleTicket: MovieTicket = {
    id: 'test-ticket-1',
    title: 'Test Movie Premiere',
    description: 'An exclusive screening test',
    price: 100,
    date: '2026-09-01',
    time: '20:00',
    venue: 'Silverbird Cinemas',
    trailerUrl: 'https://youtube.com/test',
    producerId: 'prod-123',
    producerName: 'Producer Test',
    totalQuantity: 50,
    availableQuantity: 50,
    coverUrl: 'https://images.unsplash.com/test',
    createdAt: new Date().toISOString(),
    category: 'movie'
  };

  it('retrieves default and local tickets', async () => {
    const tickets = await getTickets();
    expect(Array.isArray(tickets)).toBe(true);
    expect(tickets.length).toBeGreaterThan(0);
  });

  it('creates and persists a new ticket', async () => {
    const created = await createTicket(sampleTicket);
    expect(created.id).toBe('test-ticket-1');
    expect(created.title).toBe('Test Movie Premiere');

    const allTickets = await getTickets();
    const found = allTickets.find(t => t.id === 'test-ticket-1');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Test Movie Premiere');
  });

  it('deletes a ticket by id and marks as deleted', async () => {
    await createTicket(sampleTicket);
    await deleteTicket(sampleTicket.id);

    const allTickets = await getTickets();
    const found = allTickets.find(t => t.id === sampleTicket.id);
    expect(found).toBeUndefined();
  });

  it('clears all tickets when requested', async () => {
    await createTicket(sampleTicket);
    await clearAllTickets();

    const allTickets = await getTickets();
    expect(allTickets.length).toBe(0);
  });
});
