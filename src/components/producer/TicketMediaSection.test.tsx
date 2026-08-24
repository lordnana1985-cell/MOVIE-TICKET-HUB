import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TicketMediaSection from './TicketMediaSection';

describe('TicketMediaSection Unit Tests', () => {
  const defaultProps = {
    trailerUrl: 'https://youtube.com/watch?v=mocktrailer123',
    setTrailerUrl: vi.fn(),
    videoSource: 'url' as const,
    setVideoSource: vi.fn(),
    videoFile: null,
    setVideoFile: vi.fn(),
    coverSource: 'template' as const,
    setCoverSource: vi.fn(),
    selectedCover: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
    setSelectedCover: vi.fn(),
    customCover: '',
    setCustomCover: vi.fn(),
    coverFile: null,
    setCoverFile: vi.fn(),
  };

  it('renders video source options and cover source buttons', () => {
    render(<TicketMediaSection {...defaultProps} />);

    expect(screen.getByText('PREVIEW TRAILER / PROMO MEDIA *')).toBeInTheDocument();
    expect(screen.getByText('YOUTUBE LINK')).toBeInTheDocument();
    expect(screen.getByText('UPLOAD VIDEO FILE')).toBeInTheDocument();
    expect(screen.getByText('TEMPLATES / URL')).toBeInTheDocument();
    expect(screen.getByText('UPLOAD COVER IMAGE')).toBeInTheDocument();
  });

  it('switches video source when buttons are clicked', () => {
    render(<TicketMediaSection {...defaultProps} />);

    const uploadVideoBtn = screen.getByText('UPLOAD VIDEO FILE');
    fireEvent.click(uploadVideoBtn);
    expect(defaultProps.setVideoSource).toHaveBeenCalledWith('file');
  });

  it('switches cover source when buttons are clicked', () => {
    render(<TicketMediaSection {...defaultProps} />);

    const uploadCoverBtn = screen.getByText('UPLOAD COVER IMAGE');
    fireEvent.click(uploadCoverBtn);
    expect(defaultProps.setCoverSource).toHaveBeenCalledWith('file');
  });

  it('updates trailerUrl when entering YouTube link', () => {
    render(<TicketMediaSection {...defaultProps} />);

    const input = screen.getByPlaceholderText(/youtube\.com/i);
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=newpromo' } });
    expect(defaultProps.setTrailerUrl).toHaveBeenCalledWith('https://youtube.com/watch?v=newpromo');
  });
});
