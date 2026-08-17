import React from 'react';
import { Users, Search, Building, Phone, Trash2 } from 'lucide-react';
import { UserProfile } from '../../types';

interface AdminUserTableProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  profileSearch: string;
  onProfileSearchChange: (search: string) => void;
  profileRoleFilter: 'all' | 'producer' | 'buyer' | 'admin';
  onRoleFilterChange: (role: 'all' | 'producer' | 'buyer' | 'admin') => void;
  onSelectProfileToDelete: (profile: UserProfile) => void;
}

export default function AdminUserTable({
  currentUser,
  profiles,
  profileSearch,
  onProfileSearchChange,
  profileRoleFilter,
  onRoleFilterChange,
  onSelectProfileToDelete,
}: AdminUserTableProps) {
  return (
    <div className="glass-panel rounded-2xl border border-white/5 p-6 space-y-4" id="admin-user-table-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-rose-500" />
          <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
            USER ACCOUNTS REGISTERED ({profiles.length})
          </h3>
        </div>

        {/* Role filter pills */}
        <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5 self-start">
          {(['all', 'producer', 'buyer', 'admin'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => onRoleFilterChange(role)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition-all ${
                profileRoleFilter === role
                  ? 'bg-rose-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Profile search */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Search user name, email, production studio..."
          value={profileSearch}
          onChange={(e) => onProfileSearchChange(e.target.value)}
          className="w-full rounded-xl bg-black/40 border border-white/5 px-3 py-2 pl-10 text-xs text-white placeholder-gray-600 focus:border-rose-500 focus:outline-none transition-all"
        />
      </div>

      {/* Profiles directory list */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
        {profiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-mono text-xs">
            No registered profiles matching filters.
          </div>
        ) : (
          profiles.map((profile) => (
            <div
              key={profile.id}
              className="p-4 rounded-xl bg-black/20 hover:bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border shrink-0 text-xs ${
                    profile.role === 'admin'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : profile.role === 'producer'
                      ? 'bg-gold/10 text-gold border-gold/30'
                      : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                  }`}
                >
                  {profile.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-white truncate">{profile.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest font-bold ${
                        profile.role === 'admin'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : profile.role === 'producer'
                          ? 'bg-gold/20 text-gold border border-gold/30'
                          : 'bg-sky-500/20 text-sky-450 border border-sky-400/20'
                      }`}
                    >
                      {profile.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono truncate">{profile.email}</p>

                  {profile.role === 'producer' && (
                    <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-gray-500">
                      {profile.companyName && (
                        <p className="flex items-center gap-1 text-gray-300">
                          <Building className="h-3 w-3 shrink-0" />
                          <span>Studio: {profile.companyName}</span>
                        </p>
                      )}
                      {profile.phoneNumber && (
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>Phone: {profile.phoneNumber}</span>
                        </p>
                      )}
                      {profile.paystackSubaccountCode && (
                        <p className="font-mono text-[9px] text-sky-light/80">
                          Paystack Subaccount: {profile.paystackSubaccountCode}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t border-white/5 pt-3 sm:border-0 sm:pt-0">
                {profile.role === 'producer' && (
                  <div className="text-right sm:text-right flex flex-col">
                    <span className="text-[8px] font-mono text-gray-500 uppercase leading-none">
                      REVENUE BLOCK
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 leading-normal">
                      GH₵{profile.balance.toLocaleString()}
                    </span>
                  </div>
                )}

                {profile.id !== currentUser.id ? (
                  <button
                    onClick={() => onSelectProfileToDelete(profile)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/5 hover:bg-rose-500/20 text-rose-400 hover:text-white text-[10px] font-mono font-bold transition-all cursor-pointer border border-rose-500/10"
                    title="Remove Account"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>DELETE USER</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-rose-500 font-mono font-bold tracking-wider uppercase bg-rose-500/10 px-2 py-1 rounded">
                    YOU (ADMIN)
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
