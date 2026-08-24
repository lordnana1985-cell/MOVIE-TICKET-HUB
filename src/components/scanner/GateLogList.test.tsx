import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import GateLogList from './GateLogList';
import { GateLog } from '../../types';

describe('GateLogList Unit Tests', () => {
  const mockLogs: GateLog[] = [
    {
      id: 'log-1',
      ticketId: 'tkt-1',
      purchaseId: 'TKT-PASS-1234567890',
      movieTitle: 'The Director Cut',
      buyerName: 'Kofi Mensah',
      status: 'success',
      scannedAt: '2026-08-24T12:00:00Z',
    },
    {
      id: 'log-2',
      ticketId: 'tkt-2',
      purchaseId: 'TKT-PASS-0987654321',
      movieTitle: 'Afrobeats Fest',
      buyerName: 'Ama Serwaa',
      status: 'already_used',
      scannedAt: '2026-08-24T12:05:00Z',
    },
  ];

  it('renders empty placeholder when logs array is empty', () => {
    render(<GateLogList logs={[]} />);
    expect(screen.getByText(/No tickets checked in at the gate yet/i)).toBeInTheDocument();
  });

  it('renders log entries with status badges and timestamps', () => {
    render(<GateLogList logs={mockLogs} />);

    expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
    expect(screen.getByText('The Director Cut')).toBeInTheDocument();
    expect(screen.getByText('GRANTED')).toBeInTheDocument();

    expect(screen.getByText('Ama Serwaa')).toBeInTheDocument();
    expect(screen.getByText('Afrobeats Fest')).toBeInTheDocument();
    expect(screen.getByText('USED')).toBeInTheDocument();
  });
});
