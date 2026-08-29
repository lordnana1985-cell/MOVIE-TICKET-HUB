import React from 'react';
import { UserRole } from '../../types';
import { Ticket, Shield, Lock } from 'lucide-react';

export interface RoleSwitcherProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  showAdminTab: boolean;
}

export default function RoleSwitcher({ role, onRoleChange, showAdminTab }: RoleSwitcherProps) {
  return (
    <div
      className={`grid ${showAdminTab ? 'grid-cols-3' : 'grid-cols-2'} p-1 rounded-xl bg-black/40 border border-white/10 relative`}
      data-testid="role-switcher-container"
    >
      <button
        type="button"
        onClick={() => onRoleChange('buyer')}
        className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
          role === 'buyer'
            ? 'bg-gradient-to-r from-sky-deep to-sky-light text-black font-bold shadow-lg shadow-sky-950/50'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        id="page-buyer-role-tab"
      >
        <Ticket className="h-3.5 w-3.5" />
        Customer
      </button>

      <button
        type="button"
        onClick={() => onRoleChange('producer')}
        className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
          role === 'producer'
            ? 'bg-gradient-to-r from-gold to-gold-dark text-black font-bold shadow-lg shadow-gold/20'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        id="page-producer-role-tab"
      >
        <Shield className="h-3.5 w-3.5" />
        Organiser
      </button>

      {showAdminTab && (
        <button
          type="button"
          onClick={() => onRoleChange('admin')}
          className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            role === 'admin'
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold shadow-lg shadow-rose-950/50'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          id="page-admin-portal-tab"
        >
          <Lock className="h-3.5 w-3.5" />
          Admin
        </button>
      )}
    </div>
  );
}
