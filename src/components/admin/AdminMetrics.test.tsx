import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AdminMetrics from './AdminMetrics';

describe('AdminMetrics Component', () => {
  it('renders all admin statistics cards with formatted values', () => {
    render(
      <AdminMetrics
        totalTicketsCount={25}
        totalProducers={8}
        totalBuyers={120}
        totalPlatformVolume={54000}
      />
    );

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText(/GH₵54,000/i)).toBeInTheDocument();
    expect(screen.getByText(/ACTIVE HUB TICKETS/i)).toBeInTheDocument();
    expect(screen.getByText(/REGISTERED ORGANISERS/i)).toBeInTheDocument();
  });
});
