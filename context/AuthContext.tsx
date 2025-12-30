
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const loadUserProfile = async (token: string) => {
    try {
      console.log("[AuthContext] Fetching profile for session...");
      const userProfile = await authService.getCurrentUser();
      
      if (userProfile) {
        setState({
          token,
          user: userProfile,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        console.warn("[AuthContext] Session exists but profile could not be resolved. Signing out.");
        await supabase.auth.signOut();
        setState({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      console.error("[AuthContext] Profile load failed:", err);
      setState(s => ({ ...s, isLoading: false }));
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("[AuthContext] Checking initial session...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          await loadUserProfile(session.access_token);
        } else {
          console.log("[AuthContext] No active session found.");
          setState(s => ({ ...s, isLoading: false }));
        }
      } catch (err) {
        console.error("[AuthContext] Auth initialization error:", err);
        setState(s => ({ ...s, isLoading: false }));
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] Event: ${event}`);
      
      if (session) {
        // If we already have a user and the token hasn't changed, don't re-fetch
        if (state.user && state.token === session.access_token) {
          return;
        }
        await loadUserProfile(session.access_token);
      } else {
        setState({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      await authService.login(email, pass);
      // State is updated by onAuthStateChange
    } catch (err) {
      setState(s => ({ ...s, isLoading: false }));
      throw err;
    }
  };

  const register = async (data: any) => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const result = await authService.register(data);
      if (result?.emailConfirmationRequired) {
        setState(s => ({ ...s, isLoading: false }));
      }
      return result;
    } catch (err) {
      setState(s => ({ ...s, isLoading: false }));
      throw err;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!state.user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', state.user.id);
      
    if (error) throw error;
    
    setState(s => ({
      ...s,
      user: s.user ? { ...s.user, ...data } : null
    }));
  };

  const logout = async () => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      await authService.logout();
    } finally {
      setState(s => ({ ...s, isLoading: false }));
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
