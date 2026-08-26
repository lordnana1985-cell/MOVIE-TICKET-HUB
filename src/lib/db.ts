import {
  supabase,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
  getSupabaseLastError,
  setSupabaseLastError,
  clearSupabaseLastError,
  getSupabaseStatus,
  uploadFile,
  clearAllSimulations,
  notifyTicketsChanged,
} from './db/client';

import { getTickets, createTicket, deleteTicket, clearAllTickets } from './db/tickets';

import {
  purchaseTicket,
  getPurchasesForBuyer,
  getPurchasesForProducer,
  authenticateTicket,
  saveGateLog,
  getGateLogs,
} from './db/purchases';

import {
  checkEmailExists,
  checkEmailOppositeRole,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  generatePaystackSubaccount,
  checkUserEmailConfirmed,
  resendVerificationEmail,
  getAllProfiles,
  deleteProfile,
} from './db/profiles';

export {
  supabase,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
  getSupabaseLastError,
  setSupabaseLastError,
  clearSupabaseLastError,
  getSupabaseStatus,
  notifyTicketsChanged,
};

export const db = {
  uploadFile,
  clearAllSimulations,
  checkEmailExists,
  checkEmailOppositeRole,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  generatePaystackSubaccount,
  checkUserEmailConfirmed,
  resendVerificationEmail,
  getAllProfiles,
  deleteProfile,
  getTickets,
  createTicket,
  deleteTicket,
  clearAllTickets,
  purchaseTicket,
  getPurchasesForBuyer,
  getPurchasesForProducer,
  authenticateTicket,
  saveGateLog,
  getGateLogs,
};

export default db;
