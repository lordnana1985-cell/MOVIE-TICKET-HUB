import React from 'react';
import { MapPin, Calendar, Clock } from 'lucide-react';

interface TicketFormFieldsProps {
  category: 'movie' | 'music' | 'beauty' | 'campus' | 'other';
  onCategoryChange: (val: 'movie' | 'music' | 'beauty' | 'campus' | 'other') => void;
  title: string;
  onTitleChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  price: number;
  onPriceChange: (val: number) => void;
  totalQuantity: number;
  onTotalQuantityChange: (val: number) => void;
  venue: string;
  onVenueChange: (val: string) => void;
  date: string;
  onDateChange: (val: string) => void;
  time: string;
  onTimeChange: (val: string) => void;
}

export default function TicketFormFields({
  category,
  onCategoryChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  price,
  onPriceChange,
  totalQuantity,
  onTotalQuantityChange,
  venue,
  onVenueChange,
  date,
  onDateChange,
  time,
  onTimeChange,
}: TicketFormFieldsProps) {
  return (
    <>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="ticket-category-select"
            className="block text-xs font-medium text-gray-300 mb-1.5 font-mono"
          >
            EVENT CATEGORY *
          </label>
          <select
            id="ticket-category-select"
            value={category}
            onChange={(e) =>
              onCategoryChange(e.target.value as 'movie' | 'music' | 'beauty' | 'campus' | 'other')
            }
            className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold font-medium"
          >
            <option value="movie" className="bg-slate-950">
              Movie Premier / Cinema
            </option>
            <option value="music" className="bg-slate-950">
              Music Show / Live Concert
            </option>
            <option value="beauty" className="bg-slate-950">
              Beauty Pageant Show
            </option>
            <option value="campus" className="bg-slate-950">
              Campus Event / Student Show
            </option>
            <option value="other" className="bg-slate-950">
              Other Shows / Live Events
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="ticket-title-input"
            className="block text-xs font-medium text-gray-300 mb-1.5 font-mono"
          >
            {category === 'movie'
              ? 'MOVIE TITLE *'
              : category === 'music'
                ? 'MUSIC SHOW TITLE *'
                : category === 'beauty'
                  ? 'BEAUTY PAGEANT TITLE *'
                  : category === 'campus'
                    ? 'CAMPUS EVENT TITLE *'
                    : 'EVENT TITLE *'}
          </label>
          <input
            id="ticket-title-input"
            type="text"
            required
            placeholder="Enter event title..."
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        <div>
          <label
            htmlFor="ticket-desc-textarea"
            className="block text-xs font-medium text-gray-300 mb-1.5 font-mono"
          >
            {category === 'movie' ? 'PREMIERE DESCRIPTION / SYNOPSIS *' : 'EVENT DESCRIPTION *'}
          </label>
          <textarea
            id="ticket-desc-textarea"
            required
            rows={4}
            placeholder="Provide a compelling description for attendees and ticket buyers..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="ticket-price-input"
              className="block text-xs font-medium text-gray-300 mb-1.5 font-mono"
            >
              TICKET PRICE (GH₵ GHS) *
            </label>
            <input
              id="ticket-price-input"
              type="number"
              required
              min={5}
              value={price}
              onChange={(e) => onPriceChange(Number(e.target.value))}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="ticket-quantity-input"
              className="block text-xs font-medium text-gray-300 mb-1.5 font-mono"
            >
              TOTAL TICKET COUNT *
            </label>
            <input
              id="ticket-quantity-input"
              type="number"
              required
              min={1}
              value={totalQuantity}
              onChange={(e) => onTotalQuantityChange(Number(e.target.value))}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="ticket-venue-input"
            className="block text-xs font-medium text-gray-300 mb-1.5 font-mono"
          >
            EVENT VENUE *
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <MapPin className="h-4 w-4" />
            </span>
            <input
              id="ticket-venue-input"
              type="text"
              required
              placeholder="e.g. Silverbird Cinemas, Accra Mall, Accra"
              value={venue}
              onChange={(e) => onVenueChange(e.target.value)}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="ticket-date-input"
              className="block text-xs font-medium text-gray-300 mb-1.5 font-mono"
            >
              DATE *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Calendar className="h-4 w-4" />
              </span>
              <input
                id="ticket-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 pl-10 text-sm text-white focus:border-gold focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="ticket-time-input"
              className="block text-xs font-medium text-gray-300 mb-1.5 font-mono"
            >
              TIME *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Clock className="h-4 w-4" />
              </span>
              <input
                id="ticket-time-input"
                type="time"
                required
                value={time}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 pl-10 text-sm text-white focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
