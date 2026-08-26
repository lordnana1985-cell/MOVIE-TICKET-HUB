import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TicketFormFields from './TicketFormFields';
import TicketFormNotice from './TicketFormNotice';

describe('TicketForm Modular Sub-components', () => {
  it('renders and allows editing all TicketFormFields', () => {
    const handleCategory = vi.fn();
    const handleTitle = vi.fn();
    const handleDesc = vi.fn();
    const handlePrice = vi.fn();
    const handleQuantity = vi.fn();
    const handleVenue = vi.fn();
    const handleDate = vi.fn();
    const handleTime = vi.fn();

    render(
      <TicketFormFields
        category="movie"
        onCategoryChange={handleCategory}
        title="Avatar Premiere"
        onTitleChange={handleTitle}
        description="Greatest show"
        onDescriptionChange={handleDesc}
        price={100}
        onPriceChange={handlePrice}
        totalQuantity={200}
        onTotalQuantityChange={handleQuantity}
        venue="Accra Mall"
        onVenueChange={handleVenue}
        date="2026-10-01"
        onDateChange={handleDate}
        time="18:30"
        onTimeChange={handleTime}
      />
    );

    expect(screen.getByLabelText(/EVENT CATEGORY/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Avatar Premiere')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Greatest show')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/Enter event title/i);
    fireEvent.change(titleInput, { target: { value: 'New Film' } });
    expect(handleTitle).toHaveBeenCalledWith('New Film');

    const descInput = screen.getByPlaceholderText(/compelling description/i);
    fireEvent.change(descInput, { target: { value: 'Updated description' } });
    expect(handleDesc).toHaveBeenCalledWith('Updated description');

    const venueInput = screen.getByPlaceholderText(/Silverbird Cinemas/i);
    fireEvent.change(venueInput, { target: { value: 'Kumasi City Mall' } });
    expect(handleVenue).toHaveBeenCalledWith('Kumasi City Mall');

    const categorySelect = screen.getByLabelText(/EVENT CATEGORY/i);
    fireEvent.change(categorySelect, { target: { value: 'music' } });
    expect(handleCategory).toHaveBeenCalledWith('music');
  });

  it('renders TicketFormNotice with revenue split explanation', () => {
    render(<TicketFormNotice />);
    expect(screen.getByText(/Automatic Revenue Split Enabled/i)).toBeInTheDocument();
    expect(screen.getByText(/80% of earnings/i)).toBeInTheDocument();
  });
});
