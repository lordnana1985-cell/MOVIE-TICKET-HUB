export type UserRole = 'producer' | 'buyer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  companyName?: string;
  phoneNumber?: string;
  balance: number; // accumulated earnings for producers
  paystackSubaccountCode?: string;
  settlementBank?: string;
  accountNumber?: string;
  businessName?: string;
}

export interface MovieTicket {
  id: string;
  title: string;
  description: string;
  price: number; // in NGN (since Paystack is Nigerian/African and uses NGN or USD, NGN is standard)
  date: string;
  time: string;
  venue: string;
  trailerUrl: string; // youtube embed or video link
  producerId: string;
  producerName: string;
  totalQuantity: number;
  availableQuantity: number;
  coverUrl: string;
  createdAt: string;
  isLocalOnly?: boolean;
  category?: 'movie' | 'music' | 'beauty' | 'campus' | 'other';
}

export interface TicketPurchase {
  id: string;
  ticketId: string;
  movieTitle: string;
  movieCoverUrl: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  amountPaid: number;
  producerEarning: number; // 80%
  hubEarning: number;      // 20%
  paystackRef: string;
  purchasedAt: string;
  status: 'unused' | 'used';
  scannedAt?: string;
}

export interface GateLog {
  id: string;
  purchaseId: string;
  ticketId: string;
  movieTitle: string;
  buyerName: string;
  scannedAt: string;
  status: 'success' | 'already_used' | 'invalid';
}
