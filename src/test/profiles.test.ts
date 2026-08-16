import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerUser, getUserProfile, updateUserProfile, checkEmailExists, generatePaystackSubaccount } from '../lib/db/profiles';
import { UserProfile } from '../types';

describe('profiles db module', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const sampleProfile: Omit<UserProfile, 'balance'> = {
    id: 'user-profile-test',
    email: 'producer@studio.com',
    role: 'producer',
    name: 'Premier Studios',
    companyName: 'Premier Studios Ltd',
    phoneNumber: '+233240000000',
    paystackSubaccountCode: 'SUB_123456'
  };

  it('registers and retrieves user profile from storage', async () => {
    const registered = await registerUser(sampleProfile);
    expect(registered.balance).toBe(0);
    expect(registered.email).toBe('producer@studio.com');

    const retrieved = await getUserProfile('user-profile-test');
    expect(retrieved).toBeDefined();
    expect(retrieved?.email).toBe('producer@studio.com');
    expect(retrieved?.paystackSubaccountCode).toBe('SUB_123456');
    expect(retrieved?.role).toBe('producer');
  });

  it('updates an existing profile', async () => {
    await registerUser(sampleProfile);
    const updated = await updateUserProfile('user-profile-test', {
      companyName: 'Updated Studios Ltd',
      phoneNumber: '+233241111111'
    });

    expect(updated.companyName).toBe('Updated Studios Ltd');
    expect(updated.phoneNumber).toBe('+233241111111');
  });

  it('checks if an email exists', async () => {
    await registerUser(sampleProfile);
    const exists = await checkEmailExists('producer@studio.com');
    expect(exists).toBe(true);

    const nonExistent = await checkEmailExists('unknown@studio.com');
    expect(nonExistent).toBe(false);
  });

  it('generates a Paystack subaccount code simulation', async () => {
    await registerUser(sampleProfile);
    const code = await generatePaystackSubaccount('user-profile-test');
    expect(code).toBeDefined();
    expect(code.startsWith('SUB_')).toBe(true);

    const profile = await getUserProfile('user-profile-test');
    expect(profile?.paystackSubaccountCode).toBe(code);
  });
});
