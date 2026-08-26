import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, RefreshCw } from 'lucide-react';
import { db } from '../lib/db';
import { logger } from '../lib/logger';
import { UserProfile, MovieTicket } from '../types';
import AdminMetrics from './admin/AdminMetrics';
import AdminTicketTable from './admin/AdminTicketTable';
import AdminUserTable from './admin/AdminUserTable';
import AdminModals from './admin/AdminModals';

interface AdminPortalProps {
  user: UserProfile;
  tickets: MovieTicket[];
  onDataChanged: () => void;
}

export default function AdminPortal({
  user,
  tickets: initialTickets,
  onDataChanged,
}: AdminPortalProps) {
  const [tickets, setTickets] = useState<MovieTicket[]>(initialTickets);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search and Filter states
  const [ticketSearch, setTicketSearch] = useState('');
  const [profileSearch, setProfileSearch] = useState('');
  const [profileRoleFilter, setProfileRoleFilter] = useState<
    'all' | 'producer' | 'buyer' | 'admin'
  >('all');

  // Confirmation Modals state
  const [ticketToDelete, setTicketToDelete] = useState<MovieTicket | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const allProfiles = await db.getAllProfiles();
      setProfiles(allProfiles);

      const allTickets = await db.getTickets();
      setTickets(allTickets);
    } catch (err: any) {
      logger.error('Failed to load admin data:', 'AdminPortal', { error: err?.message || err });
      setError('Failed to fetch admin dashboard records. Please check database connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicketConfirm = async () => {
    if (!ticketToDelete) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    const deletedId = ticketToDelete.id;
    const deletedTitle = ticketToDelete.title;
    try {
      setTickets((prev) => prev.filter((t) => t.id !== deletedId));
      const result = await db.deleteTicket(deletedId);
      if (result) {
        setSuccess(`Event ticket "${deletedTitle}" has been deleted from the market.`);
        setTicketToDelete(null);
        onDataChanged();
      } else {
        throw new Error('Ticket deletion failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete ticket.');
      await loadAdminData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProfileConfirm = async () => {
    if (!profileToDelete) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    const targetProfile = profileToDelete;
    try {
      setProfiles((prev) => prev.filter((p) => p.id !== targetProfile.id));
      if (targetProfile.role === 'producer') {
        setTickets((prev) => prev.filter((t) => t.producerId !== targetProfile.id));
      }

      const result = await db.deleteProfile(targetProfile.id);
      if (result) {
        setSuccess(
          `Account for "${targetProfile.name}" (${targetProfile.role}) was successfully deleted.`
        );
        setProfileToDelete(null);
        onDataChanged();
      } else {
        throw new Error('Account deletion failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to remove account.');
      await loadAdminData();
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered lists
  const filteredTickets = tickets.filter(
    (t) =>
      t.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.venue.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.producerName.toLowerCase().includes(ticketSearch.toLowerCase())
  );

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(profileSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(profileSearch.toLowerCase()) ||
      (p.companyName && p.companyName.toLowerCase().includes(profileSearch.toLowerCase()));

    const matchesRole = profileRoleFilter === 'all' || p.role === profileRoleFilter;

    return matchesSearch && matchesRole;
  });

  // High-level metrics
  const totalProducers = profiles.filter((p) => p.role === 'producer').length;
  const totalBuyers = profiles.filter((p) => p.role === 'buyer').length;
  const totalTicketsCount = tickets.length;
  const totalPlatformVolume = profiles.reduce(
    (acc, p) => acc + (p.role === 'producer' ? p.balance : 0),
    0
  );

  return (
    <div className="space-y-8 animate-fadeIn" id="admin-portal-root">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-rose-500 mb-1">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">
              ADMINISTRATIVE OVERWATCH
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-black text-white tracking-tight">
            SYSTEM CONTROL PANEL
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Oversee tickets, terminate rogue assets, and delete producer or buyer accounts from the
            core database.
          </p>
        </div>
        <button
          onClick={loadAdminData}
          disabled={loading}
          className="self-start md:self-center flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2.5 text-xs font-mono font-bold text-white transition-all cursor-pointer"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-rose-500' : 'text-gray-400'}`}
          />
          <span>REFRESH SYSTEM RECORDS</span>
        </button>
      </div>

      {/* FEEDBACK NOTIFICATION DESPATCHERS */}
      {success && (
        <div
          className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-400 animate-fadeIn"
          id="admin-alert-success"
        >
          <Activity className="h-4.5 w-4.5 shrink-0 animate-pulse text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div
          className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-400 animate-fadeIn"
          id="admin-alert-error"
        >
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* STATISTICS MATRIX */}
      <AdminMetrics
        totalTicketsCount={totalTicketsCount}
        totalProducers={totalProducers}
        totalBuyers={totalBuyers}
        totalPlatformVolume={totalPlatformVolume}
      />

      {/* CORE CONTROL BOARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: TICKETS IN MARKET (5/12 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <AdminTicketTable
            tickets={filteredTickets}
            ticketSearch={ticketSearch}
            onSearchChange={setTicketSearch}
            onSelectTicketToDelete={(ticket) => setTicketToDelete(ticket)}
          />
        </div>

        {/* RIGHT COLUMN: USER ACCOUNTS DIRECTORY (7/12 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <AdminUserTable
            currentUser={user}
            profiles={filteredProfiles}
            profileSearch={profileSearch}
            onProfileSearchChange={setProfileSearch}
            profileRoleFilter={profileRoleFilter}
            onRoleFilterChange={setProfileRoleFilter}
            onSelectProfileToDelete={(profile) => setProfileToDelete(profile)}
          />
        </div>
      </div>

      {/* CONFIRMATION OVERLAYS / MODALS */}
      <AdminModals
        ticketToDelete={ticketToDelete}
        profileToDelete={profileToDelete}
        actionLoading={actionLoading}
        onCancelTicketDelete={() => setTicketToDelete(null)}
        onConfirmTicketDelete={handleDeleteTicketConfirm}
        onCancelProfileDelete={() => setProfileToDelete(null)}
        onConfirmProfileDelete={handleDeleteProfileConfirm}
      />
    </div>
  );
}
