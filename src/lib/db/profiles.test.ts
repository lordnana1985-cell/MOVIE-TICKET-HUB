import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkEmailExists,
  checkEmailOppositeRole,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllProfiles,
} from './profiles';
import { UserProfile } from '../../types';

describe('Profiles Database Module & LocalStorage Fallback', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('registers a user into local storage and verifies email existence', async () => {
    const mockUser: Omit<UserProfile, 'balance'> = {
      id: 'test-user-1',
      email: 'organizer@test.com',
      name: 'Organizer One',
      role: 'producer',
      companyName: 'Cinema Corp',
      phoneNumber: '0241234567',
    };

    const registered = await registerUser(mockUser);
    expect(registered.email).toBe('organizer@test.com');
    expect(registered.balance).toBe(0);

    const exists = await checkEmailExists('organizer@test.com');
    expect(exists).toBe(true);

    const nonexistent = await checkEmailExists('unknown@test.com');
    expect(nonexistent).toBe(false);
  });

  it('checks opposite role for an email correctly', async () => {
    await registerUser({
      id: 'buyer-1',
      email: 'sam@example.com',
      name: 'Sam Buyer',
      role: 'buyer',
    });

    const oppositeForProducer = await checkEmailOppositeRole('sam@example.com', 'producer');
    expect(oppositeForProducer).toBe('buyer');

    const oppositeForBuyer = await checkEmailOppositeRole('sam@example.com', 'buyer');
    expect(oppositeForBuyer).toBeNull();
  });

  it('logs in and retrieves existing profiles with balance and updates', async () => {
    await registerUser({
      id: 'user-xyz',
      email: 'alex@events.com',
      name: 'Alex Producer',
      role: 'producer',
    });

    const loggedIn = await loginUser('alex@events.com', 'producer');
    expect(loggedIn).not.toBeNull();
    expect(loggedIn?.name).toBe('Alex Producer');

    const fetchedProfile = await getUserProfile('user-xyz');
    expect(fetchedProfile?.id).toBe('user-xyz');

    const updated = await updateUserProfile('user-xyz', {
      businessName: 'Apex Cinemas Ghana',
      settlementBank: 'MTN',
    });
    expect(updated?.businessName).toBe('Apex Cinemas Ghana');
    expect(updated?.settlementBank).toBe('MTN');

    const allProfiles = await getAllProfiles();
    expect(allProfiles.length).toBeGreaterThanOrEqual(1);
  });
});
