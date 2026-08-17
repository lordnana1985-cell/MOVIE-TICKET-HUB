import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ClearAllModal from './ClearAllModal';

describe('ClearAllModal Component', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ClearAllModal isOpen={false} isClearing={false} onCancel={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders warning and triggers confirm/cancel when isOpen is true', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ClearAllModal isOpen={true} isClearing={false} onCancel={onCancel} onConfirm={onConfirm} />
    );

    expect(screen.getByText(/CLEAR ALL TICKETS PROMPT/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Yes, Clear All Tickets/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
