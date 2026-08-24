import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomerSupport, { EmbeddedSupportCard } from './CustomerSupport';

describe('CustomerSupport Components Unit Tests', () => {
  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockWriteText.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      configurable: true,
    });
  });

  it('renders EmbeddedSupportCard with support details and copy action', () => {
    render(<EmbeddedSupportCard />);
    expect(screen.getByText(/Need Assistance or Split Payout Info\?/i)).toBeInTheDocument();
    expect(screen.getByText(/0543198585/i)).toBeInTheDocument();

    const copyBtn = screen.getByTitle(/Copy Number/i);
    fireEvent.click(copyBtn);
    expect(mockWriteText).toHaveBeenCalledWith('0543198585');
  });

  it('renders floating CustomerSupport trigger button and expands modal', () => {
    render(<CustomerSupport />);
    const triggerBtn = screen.getByRole('button');
    fireEvent.click(triggerBtn);

    expect(screen.getByText(/CUSTOMER SUPPORT/i)).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp Chat/i)).toBeInTheDocument();
  });
});
