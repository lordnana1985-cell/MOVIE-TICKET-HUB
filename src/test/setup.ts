import '@testing-library/jest-dom';
import { vi } from 'vitest';

process.env.IS_TEST_ENV = 'true';
process.env.NODE_ENV = 'test';

// Cleanly mock Supabase client in tests so DB functions gracefully fallback to local storage
const createMockQueryBuilder = () => {
  const builder: any = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => builder),
    then: (resolve: (val: any) => any) =>
      Promise.resolve({ data: null, error: null }).then(resolve),
    catch: (reject: (err: any) => any) =>
      Promise.resolve({ data: null, error: null }).catch(reject),
  };
  return builder;
};

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: vi.fn(() => createMockQueryBuilder()),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn().mockResolvedValue({}),
      })),
      auth: {
        signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        resend: vi.fn().mockResolvedValue({ error: null }),
      },
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: null, error: null }),
          remove: vi.fn().mockResolvedValue({ data: null, error: null }),
          getPublicUrl: vi.fn(() => ({
            data: {
              publicUrl: 'https://test-project.supabase.co/storage/v1/object/public/test.jpg',
            },
          })),
        })),
      },
    })),
  };
});

if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = 'https://test-project.supabase.co';
}
if (!process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
}
