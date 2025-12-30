
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

// Normalizes shorthand 'admin' to the full 'administrator' type used in the frontend
const normalizeRole = (role: string): UserRole => {
  if (role === 'admin') return 'administrator';
  return role as UserRole;
};

const mapProfile = (profile: any, authUser?: any): User => ({
  ...profile,
  firstName: profile.first_name || profile.firstName || authUser?.user_metadata?.first_name || 'User',
  lastName: profile.last_name || profile.lastName || authUser?.user_metadata?.last_name || '',
  role: normalizeRole(profile.role || authUser?.user_metadata?.role || 'student'),
  themePreference: profile.theme_preference || profile.themePreference || 'light',
  createdAt: profile.created_at || profile.createdAt || authUser?.created_at,
  isActive: profile.is_active ?? profile.isActive ?? true
});

export const authService = {
  login: async (email: string, password: string) => {
    console.log(`[AuthService] Attempting login for: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(`[AuthService] Login failed:`, error.message);
      throw error;
    }

    console.log(`[AuthService] Auth successful, fetching profile for: ${data.user.id}`);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.warn(`[AuthService] Profile fetch failed, using metadata fallback.`);
      return { 
        user: mapProfile({}, data.user), 
        session: data.session 
      };
    }

    return { user: mapProfile(profile, data.user), session: data.session };
  },

  register: async (data: any) => {
    console.log(`[AuthService] Registering user: ${data.email} as ${data.role}`);
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role, // 'administrator'
        },
      },
    });

    if (error) {
      console.error(`[AuthService] signUp error:`, error.message);
      throw error;
    }

    if (!authData.session) {
      return { user: null, session: null, emailConfirmationRequired: true };
    }

    return { user: null, session: authData.session, emailConfirmationRequired: false };
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async (retries = 3): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    for (let i = 0; i < retries; i++) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        return mapProfile(profile, user);
      }

      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, 500 * (i + 1)));
      }
    }

    return mapProfile({}, user);
  }
};
