import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TicketFormPreview from './TicketFormPreview';

describe('TicketFormPreview Unit Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Accra Cinema Premiere',
    description: 'Exclusive first screening of the documentary.',
    price: 75,
    venue: 'Silverbird Cinemas, Accra',
    coverImageSrc: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<TicketFormPreview {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders event details, pricing, and image correctly when open', () => {
    render(<TicketFormPreview {...defaultProps} />);

    expect(screen.getByText('Ticket Preview')).toBeInTheDocument();
    expect(screen.getByText('Accra Cinema Premiere')).toBeInTheDocument();
    expect(screen.getByText('Exclusive first screening of the documentary.')).toBeInTheDocument();
    expect(screen.getByText('GH₵75')).toBeInTheDocument();
    expect(screen.getByText('Silverbird Cinemas, Accra')).toBeInTheDocument();

    const img = screen.getByRole('img', { name: /Ticket Preview/i });
    expect(img).toHaveAttribute('src', defaultProps.coverImageSrc);
  });

  it('calls onClose when close button is clicked', () => {
    render(<TicketFormPreview {...defaultProps} />);

    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('falls back to default placeholder text when props are empty', () => {
    render(
      <TicketFormPreview
        isOpen={true}
        onClose={vi.fn()}
        title=""
        description=""
        price={0}
        venue=""
        coverImageSrc=""
      />
    );

    expect(screen.getByText('Untitled Event')).toBeInTheDocument();
    expect(screen.getByText('No description provided.')).toBeInTheDocument();
    expect(screen.getByText('Venue TBD')).toBeInTheDocument();
  });
});
