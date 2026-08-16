import { MovieTicket, UserProfile, TicketPurchase } from '../../types';

export const DEFAULT_MOVIES: MovieTicket[] = [
  {
    id: 'm1',
    title: 'The Golden Eclipse',
    description: 'A mind-bending sci-fi epic exploring the outer boundaries of human perception when a celestial event triggers dimensional shifts.',
    price: 150, // in GHS (e.g. GH₵150)
    date: '2026-08-15',
    time: '18:00',
    venue: 'Silverbird Cinemas, Accra Mall, Accra',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    producerId: 'p1',
    producerName: 'Kofi Mensah',
    totalQuantity: 200,
    availableQuantity: 184,
    coverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600',
    createdAt: new Date().toISOString()
  },
  {
    id: 'm2',
    title: 'Echoes of the Sky',
    description: 'An emotional romance set in the highlands, where music, destiny, and memories collide over a single majestic summer.',
    price: 100, // GH₵100
    date: '2026-09-01',
    time: '20:00',
    venue: 'Silverbird Cinemas, West Hills Mall, Weija',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    producerId: 'p1',
    producerName: 'Kofi Mensah',
    totalQuantity: 150,
    availableQuantity: 142,
    coverUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600',
    createdAt: new Date().toISOString()
  },
  {
    id: 'm3',
    title: 'Shadows of the Kingdom',
    description: 'A historical drama following the rise of an empire, filled with betrayals, glorious battles, and a quest for absolute crown.',
    price: 250, // GH₵250
    date: '2026-08-20',
    time: '17:00',
    venue: 'Global Cinemas, Weija, Accra',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    producerId: 'p2',
    producerName: 'Ama Serwaa',
    totalQuantity: 100,
    availableQuantity: 95,
    coverUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600',
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'admin1',
    email: 'admin@movieticket.com',
    role: 'admin',
    name: 'System Admin',
    balance: 0
  },
  {
    id: 'p1',
    email: 'producer@example.com',
    role: 'producer',
    name: 'Kofi Mensah',
    companyName: 'Accra Film Studios',
    balance: 15000
  },
  {
    id: 'p2',
    email: 'ama@example.com',
    role: 'producer',
    name: 'Ama Serwaa',
    companyName: 'Gold Coast Pictures',
    balance: 8500
  },
  {
    id: 'b1',
    email: 'buyer@example.com',
    role: 'buyer',
    name: 'John Doe',
    balance: 0
  }
];

export const DEFAULT_PURCHASES: TicketPurchase[] = [
  {
    id: 't-demo-1',
    ticketId: 'm1',
    movieTitle: 'The Golden Eclipse',
    movieCoverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600',
    buyerId: 'b1',
    buyerName: 'John Doe',
    buyerEmail: 'buyer@example.com',
    amountPaid: 150,
    producerEarning: 120, // 80%
    hubEarning: 30,      // 20%
    paystackRef: 'pstk_test_123456789',
    purchasedAt: '2026-07-01T14:30:00Z',
    status: 'unused'
  }
];
