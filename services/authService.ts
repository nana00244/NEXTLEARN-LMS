
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

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

    // Fetch the profile associated with the user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.warn(`[AuthService] Profile fetch failed, using fallback metadata:`, profileError.message);
      // Fallback to metadata if profile record doesn't exist yet
      return { 
        user: {
          id: data.user.id,
          email: data.user.email!,
          firstName: data.user.user_metadata.first_name || 'User',
          lastName: data.user.user_metadata.last_name || '',
          role: data.user.user_metadata.role as UserRole || 'student',
          themePreference: 'light',
          createdAt: data.user.created_at,
          isActive: true
        } as User, 
        session: data.session 
      };
    }

    // Map snake_case from DB to camelCase for the UI
    const mappedUser: User = {
      ...profile,
      firstName: profile.first_name || profile.firstName,
      lastName: profile.last_name || profile.lastName,
      themePreference: profile.theme_preference || profile.themePreference || 'light',
      createdAt: profile.created_at || profile.createdAt,
      isActive: profile.is_active ?? profile.isActive ?? true
    };

    console.log(`[AuthService] Login complete. Role: ${mappedUser.role}`);
    return { user: mappedUser, session: data.session };
  },

  register: async (data: any) => {
    console.log(`[AuthService] Starting signup for: ${data.email} with role: ${data.role}`);
    
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

    if (error) {
      console.error(`[AuthService] Supabase signUp error:`, error.message);
      throw error;
    }

    console.log(`[AuthService] signUp response received. User ID: ${authData.user?.id}`);

    // If no session is returned, email confirmation is required in Supabase settings
    if (!authData.session) {
      console.log(`[AuthService] No session returned. Email confirmation required.`);
      return { user: null, session: null, emailConfirmationRequired: true };
    }

    console.log(`[AuthService] Signup successful. Session established.`);
    return { user: null, session: authData.session, emailConfirmationRequired: false };
  },

  logout: async () => {
    console.log(`[AuthService] Logging out...`);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async (retries = 3): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    console.log(`[AuthService] Getting current user: ${user.id}`);

    // 1. Try to fetch from profiles table
    for (let i = 0; i < retries; i++) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        return {
          ...profile,
          firstName: profile.first_name || profile.firstName,
          lastName: profile.last_name || profile.lastName,
          themePreference: profile.theme_preference || profile.themePreference || 'light',
          createdAt: profile.created_at || profile.createdAt,
          isActive: profile.is_active ?? profile.isActive ?? true
        } as User;
      }

      if (i < retries - 1) {
        console.log(`[AuthService] Profile not found, retry ${i+1}/${retries}...`);
        await new Promise(res => setTimeout(res, 500 * (i + 1)));
      }
    }

    // 2. Fallback: Use Auth Metadata if DB profile isn't ready
    if (user.user_metadata) {
      console.log(`[AuthService] Using metadata fallback for user: ${user.id}`);
      return {
        id: user.id,
        email: user.email!,
        firstName: user.user_metadata.first_name || 'User',
        lastName: user.user_metadata.last_name || '',
        role: user.user_metadata.role as UserRole || 'student',
        themePreference: 'light',
        createdAt: user.created_at,
        isActive: true
      };
    }

    return null;
  }
};
