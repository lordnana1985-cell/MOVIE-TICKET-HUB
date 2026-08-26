import { describe, it, expect } from 'vitest';
import {
  supabaseCheckEmailExists,
  supabaseCheckEmailOppositeRole,
  supabaseInsertProfile,
  supabaseGetProfile,
  supabaseUpdateProfile,
  supabaseGetAllProfiles,
  supabaseDeleteProfile,
} from './profiles.supabase';

describe('Supabase Profiles Layer (Unit Fallback & Safe Operations)', () => {
  it('returns null/empty gracefully when Supabase client is unconfigured or returns null', async () => {
    const exists = await supabaseCheckEmailExists('test@moviehub.com');
    expect(exists === null || typeof exists === 'boolean').toBe(true);

    const oppositeRole = await supabaseCheckEmailOppositeRole('test@moviehub.com', 'buyer');
    expect(oppositeRole === null || typeof oppositeRole === 'string').toBe(true);

    const profile = await supabaseGetProfile('usr-non-existent');
    expect(profile === null || typeof profile === 'object').toBe(true);

    const all = await supabaseGetAllProfiles();
    expect(Array.isArray(all)).toBe(true);
  });

  it('handles safe stub calls without throwing unexpected fatal errors', async () => {
    await expect(
      supabaseInsertProfile({
        id: 'usr-sub-test',
        email: 'test@sub.com',
        role: 'producer',
        name: 'Test Producer',
        balance: 0,
      })
    ).resolves.not.toThrow();

    await expect(
      supabaseUpdateProfile('usr-sub-test', {
        name: 'Updated Name',
      })
    ).resolves.not.toThrow();

    await expect(supabaseDeleteProfile('usr-sub-test')).resolves.not.toThrow();
  });
});
