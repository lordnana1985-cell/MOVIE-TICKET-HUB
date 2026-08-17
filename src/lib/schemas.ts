import { z } from "zod";

export const subaccountSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  settlement_bank: z.string().min(2, "Settlement bank code is required"),
  account_number: z.string().min(6, "Account number must be at least 6 digits"),
  primary_contact_email: z.string().email("Valid primary contact email is required").optional().or(z.literal("")),
});

export const paymentInitializeSchema = z.object({
  email: z.string().email("Valid customer email is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  subaccount_code: z.string().optional(),
  callback_url: z.string().url("Valid callback URL is required").optional().or(z.literal("")),
});

export const verificationCodeSchema = z.object({
  email: z.string().email("Valid recipient email is required"),
  code: z.string().min(4, "Verification code must be at least 4 digits").max(8),
  purpose: z.string().optional(),
});

export const movieTicketSchema = z.object({
  id: z.string().min(1, "Ticket ID is required"),
  title: z.string().min(2, "Event/movie title is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  venue: z.string().min(2, "Venue location is required"),
  date: z.string().min(4, "Event date is required"),
  time: z.string().min(2, "Event time is required"),
  category: z.enum(["movie", "music", "beauty", "campus", "other"]),
  price: z.number().nonnegative("Price must be 0 or greater"),
  totalQuantity: z.number().int().positive("Capacity must be at least 1"),
  availableQuantity: z.number().int().nonnegative(),
  producerId: z.string().min(1, "Producer ID is required"),
  producerName: z.string().min(1, "Producer name is required"),
  trailerUrl: z.string().url("Valid trailer URL is required").optional().or(z.literal("")),
  coverUrl: z.string().url("Valid cover image URL is required").optional().or(z.literal("")),
});

export const ticketCreationSchema = movieTicketSchema.omit({ id: true, availableQuantity: true });

export const ticketPurchaseSchema = z.object({
  id: z.string().min(1, "Purchase ID is required"),
  ticketId: z.string().min(1, "Ticket ID is required"),
  movieTitle: z.string().min(1, "Movie title is required"),
  buyerId: z.string().min(1, "Buyer user ID is required"),
  buyerName: z.string().min(1, "Buyer name is required"),
  buyerEmail: z.string().email("Buyer email is required"),
  amountPaid: z.number().positive("Amount paid must be positive"),
  producerEarning: z.number().nonnegative(),
  hubEarning: z.number().nonnegative(),
  purchasedAt: z.string(),
  status: z.enum(["unused", "used"]),
  paystackRef: z.string().optional(),
  scannedAt: z.string().optional()
});

export type SubaccountInput = z.infer<typeof subaccountSchema>;
export type PaymentInitializeInput = z.infer<typeof paymentInitializeSchema>;
export type VerificationCodeInput = z.infer<typeof verificationCodeSchema>;
export type MovieTicketInput = z.infer<typeof movieTicketSchema>;
export type TicketCreationInput = z.infer<typeof ticketCreationSchema>;
export type TicketPurchaseInput = z.infer<typeof ticketPurchaseSchema>;
