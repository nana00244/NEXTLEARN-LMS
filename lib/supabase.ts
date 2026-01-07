// This file is now a stub to support the local-only mode.
export const isConfigured = false;
export const supabase: any = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({ single: async () => ({ data: null, error: null }) }),
      neq: () => ({ single: async () => ({ data: null, error: null }) }),
    })
  })
};