import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import MetricsOverview from './MetricsOverview';

describe('MetricsOverview Component', () => {
  it('renders all metrics cards with formatted values', () => {
    render(
      <MetricsOverview
        totalGrossRevenue={10000}
        producerShare={8000}
        hubShare={2000}
        totalSalesCount={42}
      />
    );

    expect(screen.getByText(/GH₵10,000/i)).toBeInTheDocument();
    expect(screen.getByText(/GH₵8,000/i)).toBeInTheDocument();
    expect(screen.getByText(/GH₵2,000/i)).toBeInTheDocument();
    expect(screen.getByText(/42/i)).toBeInTheDocument();
    expect(screen.getByText(/YOUR EARNINGS \(80%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/HUB COMMISSION \(20%\)/i)).toBeInTheDocument();
  });
});
