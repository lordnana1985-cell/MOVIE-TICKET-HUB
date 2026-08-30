import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkEmailExists,
  checkEmailOppositeRole,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllProfiles,
} from './profiles';
import * as supabaseProfiles from './profiles.supabase';
import { getSupabaseLastError, clearSupabaseLastError } from './client';
import { UserProfile } from '../../types';

describe('Profiles Database Module & Supabase/LocalStorage Hybrid Fallback', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSupabaseLastError();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('LocalStorage Fallback Path (When Supabase Fails)', () => {
    it('registerUser writes to LocalStorage and records last error when Supabase fails', async () => {
      vi.spyOn(supabaseProfiles, 'supabaseInsertProfile').mockRejectedValue(
        new Error('PostgreSQL 503 Service Unavailable')
      );

      const newProducer: Omit<UserProfile, 'balance'> = {
        id: 'producer-local-001',
        email: 'kwame@ghanafilms.com',
        name: 'Kwame Asante',
        role: 'producer',
        companyName: 'Golden Stool Pictures',
        phoneNumber: '0244112233',
      };

      const result = await registerUser(newProducer);

      expect(result).toBeDefined();
      expect(result.id).toBe('producer-local-001');
      expect(result.email).toBe('kwame@ghanafilms.com');
      expect(result.balance).toBe(0);
      expect(result.companyName).toBe('Golden Stool Pictures');

      expect(getSupabaseLastError()).toContain('PostgreSQL 503 Service Unavailable');

      const savedUsers = JSON.parse(localStorage.getItem('mt_hub_users') || '[]');
      expect(savedUsers.some((u: UserProfile) => u.id === 'producer-local-001')).toBe(true);
    });

    it('loginUser retrieves profile from LocalStorage when Supabase fails', async () => {
      vi.spyOn(supabaseProfiles, 'supabaseLoginProfile').mockRejectedValue(
        new Error('Network connection refused')
      );

      const storedUser: UserProfile = {
        id: 'buyer-fallback-10',
        email: 'ama@accraevents.com',
        name: 'Ama Serwaa',
        role: 'buyer',
        balance: 50,
      };
      localStorage.setItem('mt_hub_users', JSON.stringify([storedUser]));

      const loggedIn = await loginUser('ama@accraevents.com', 'buyer');

      expect(loggedIn).not.toBeNull();
      expect(loggedIn?.id).toBe('buyer-fallback-10');
      expect(loggedIn?.name).toBe('Ama Serwaa');
      expect(loggedIn?.balance).toBe(50);
      expect(getSupabaseLastError()).toContain('Network connection refused');
    });

    it('updateUserProfile updates record in LocalStorage when Supabase fails', async () => {
      vi.spyOn(supabaseProfiles, 'supabaseUpdateProfile').mockRejectedValue(
        new Error('Supabase schema lock timeout')
      );
      vi.spyOn(supabaseProfiles, 'supabaseGetProfile').mockRejectedValue(
        new Error('Supabase offline')
      );

      const initialProfile: UserProfile = {
        id: 'producer-mod-20',
        email: 'kojo@studio.com',
        name: 'Kojo Mills',
        role: 'producer',
        balance: 100,
        companyName: 'Old Films Ltd',
      };
      localStorage.setItem('mt_hub_users', JSON.stringify([initialProfile]));

      const updated = await updateUserProfile('producer-mod-20', {
        companyName: 'Black Star Cinematic Universe',
        paystackSubaccountCode: 'ACCT_GH_888999',
        balance: 450,
      });

      expect(updated).not.toBeNull();
      expect(updated?.companyName).toBe('Black Star Cinematic Universe');
      expect(updated?.paystackSubaccountCode).toBe('ACCT_GH_888999');
      expect(updated?.balance).toBe(450);

      const localUsers = JSON.parse(localStorage.getItem('mt_hub_users') || '[]');
      const targetUser = localUsers.find((u: UserProfile) => u.id === 'producer-mod-20');
      expect(targetUser?.companyName).toBe('Black Star Cinematic Universe');
      expect(targetUser?.paystackSubaccountCode).toBe('ACCT_GH_888999');
    });

    it('checkEmailExists falls back to LocalStorage when Supabase check throws', async () => {
      vi.spyOn(supabaseProfiles, 'supabaseCheckEmailExists').mockRejectedValue(
        new Error('Connection timed out')
      );

      localStorage.setItem(
        'mt_hub_users',
        JSON.stringify([
          {
            id: 'u-1',
            email: 'registered@domain.gh',
            name: 'User 1',
            role: 'buyer',
            balance: 0,
          },
        ])
      );

      const exists = await checkEmailExists('registered@domain.gh');
      expect(exists).toBe(true);

      const notExists = await checkEmailExists('missing@domain.gh');
      expect(notExists).toBe(false);
    });

    it('checkEmailOppositeRole falls back to LocalStorage when Supabase throws', async () => {
      vi.spyOn(supabaseProfiles, 'supabaseCheckEmailOppositeRole').mockRejectedValue(
        new Error('Supabase endpoint unreachable')
      );

      localStorage.setItem(
        'mt_hub_users',
        JSON.stringify([
          {
            id: 'buyer-user',
            email: 'dual@test.gh',
            name: 'Dual User',
            role: 'buyer',
            balance: 0,
          },
        ])
      );

      const opposite = await checkEmailOppositeRole('dual@test.gh', 'producer');
      expect(opposite).toBe('buyer');
    });
  });

  describe('Supabase Success Path', () => {
    it('registerUser executes via Supabase and caches profile locally', async () => {
      const insertSpy = vi.spyOn(supabaseProfiles, 'supabaseInsertProfile').mockResolvedValue();

      const result = await registerUser({
        id: 'remote-producer-55',
        email: 'yaad@cinema.gh',
        name: 'Yaa Danso',
        role: 'producer',
      });

      expect(insertSpy).toHaveBeenCalledTimes(1);
      expect(result.email).toBe('yaad@cinema.gh');
      expect(getSupabaseLastError()).toBeNull();
    });

    it('loginUser returns remote Supabase profile on success', async () => {
      const remoteUser: UserProfile = {
        id: 'remote-user-99',
        email: 'vip@accra.gh',
        name: 'VIP Customer',
        role: 'buyer',
        balance: 1200,
      };

      vi.spyOn(supabaseProfiles, 'supabaseLoginProfile').mockResolvedValue(remoteUser);

      const result = await loginUser('vip@accra.gh', 'buyer');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('remote-user-99');
      expect(result?.balance).toBe(1200);
    });

    it('getUserProfile and updateUserProfile return Supabase data on success', async () => {
      const liveProfile: UserProfile = {
        id: 'remote-user-100',
        email: 'remote@cinema.gh',
        name: 'Cinema Mogul',
        role: 'producer',
        balance: 800,
      };

      vi.spyOn(supabaseProfiles, 'supabaseGetProfile').mockResolvedValue(liveProfile);
      vi.spyOn(supabaseProfiles, 'supabaseUpdateProfile').mockResolvedValue();

      const fetched = await getUserProfile('remote-user-100');
      expect(fetched?.name).toBe('Cinema Mogul');

      const updated = await updateUserProfile('remote-user-100', {
        companyName: 'Apex Filmworks',
      });
      expect(updated?.companyName).toBe('Apex Filmworks');
    });

    it('getAllProfiles returns list of all profiles', async () => {
      localStorage.setItem(
        'mt_hub_users',
        JSON.stringify([
          { id: '1', email: 'p1@test.com', name: 'P1', role: 'producer', balance: 0 },
          { id: '2', email: 'b1@test.com', name: 'B1', role: 'buyer', balance: 0 },
        ])
      );

      const all = await getAllProfiles();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });
  });
});
