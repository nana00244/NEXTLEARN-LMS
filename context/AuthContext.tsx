
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

  useEffect(() => {
    // Initial session check
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const userProfile = await authService.getCurrentUser();
          setState({
            token: session.access_token,
            user: userProfile,
            isAuthenticated: !!userProfile,
            isLoading: false,
          });
        } else {
          setState(s => ({ ...s, isLoading: false }));
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setState(s => ({ ...s, isLoading: false }));
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Only trigger loading if we don't have a user yet or the token changed
        const userProfile = await authService.getCurrentUser();
        setState({
          token: session.access_token,
          user: userProfile,
          isAuthenticated: !!userProfile,
          isLoading: false,
        });
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
    } catch (err) {
      setState(s => ({ ...s, isLoading: false }));
      throw err;
    }
  };

  const register = async (data: any) => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const result = await authService.register(data);
      // We don't manually set isLoading: false here because 
      // onAuthStateChange will fire and update the state.
      // If result indicates email confirmation is required, we do need to set it false.
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
