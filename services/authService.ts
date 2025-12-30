import { supabase, isConfigured } from '../lib/supabase';
import { User, UserRole } from '../types';
import { getStoredUsers, findUserByEmail, saveUser } from './mockDb';

// Normalizes shorthand 'admin' to the full 'administrator' type used in the frontend
const normalizeRole = (role: string): UserRole => {
  if (!role) return 'student';
  if (role === 'admin') return 'administrator';
  return role as UserRole;
};

const mapProfile = (profile: any, authUser?: any): User => ({
  ...profile,
  id: profile.id || authUser?.id || 'demo-user',
  email: profile.email || authUser?.email || 'demo@nextlearn.com',
  firstName: profile.first_name || profile.firstName || authUser?.user_metadata?.first_name || 'Demo',
  lastName: profile.last_name || profile.lastName || authUser?.user_metadata?.last_name || 'User',
  role: normalizeRole(profile.role || authUser?.user_metadata?.role || 'administrator'),
  themePreference: profile.theme_preference || profile.themePreference || 'light',
  createdAt: profile.created_at || profile.createdAt || new Date().toISOString(),
  isActive: profile.is_active ?? profile.isActive ?? true
});

export const authService = {
  login: async (email: string, password: string) => {
    console.log(`[AuthService] Attempting login for: ${email}`);
    
    if (!isConfigured) {
      console.log("[AuthService] MOCK MODE: Authenticating against local storage.");
      const user = findUserByEmail(email);
      if (user && (user.passwordHash === password || password === 'password123')) {
        const mapped = mapProfile(user);
        localStorage.setItem('nextlearn_demo_session', JSON.stringify(mapped));
        return { user: mapped, session: { access_token: 'demo-token' } };
      }
      throw new Error("Invalid credentials. Try 'admin@nextlearn.com' with 'password123'");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(`[AuthService] Login failed:`, error.message);
      throw error;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return { 
        user: mapProfile({}, data.user), 
        session: data.session 
      };
    }

    return { user: mapProfile(profile, data.user), session: data.session };
  },

  register: async (data: any) => {
    if (!isConfigured) {
       const newUser = {
         id: 'u_' + Math.random().toString(36).substr(2, 9),
         email: data.email,
         firstName: data.firstName,
         lastName: data.lastName,
         role: data.role,
         passwordHash: data.password,
         createdAt: new Date().toISOString(),
         isActive: true
       };
       saveUser(newUser);
       return { user: mapProfile(newUser), session: null, emailConfirmationRequired: true };
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
        },
      },
    });

    if (error) throw error;

    // Manually create profile to satisfy database FK constraints
    await supabase.from('profiles').upsert({
      id: authData.user?.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      role: data.role
    });

    return { user: null, session: authData.session, emailConfirmationRequired: !authData.session };
  },

  logout: async () => {
    if (!isConfigured) {
      localStorage.removeItem('nextlearn_demo_session');
      return;
    }
    await supabase.auth.signOut();
  },

  getCurrentUser: async (retries = 1): Promise<User | null> => {
    if (!isConfigured) {
      const saved = localStorage.getItem('nextlearn_demo_session');
      return saved ? JSON.parse(saved) : null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return mapProfile(profile || {}, user);
    } catch (err) {
      return null;
    }
  }
};