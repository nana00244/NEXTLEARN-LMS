import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, AuthState } from '../types';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setIgnoreAuthEvents: (ignore: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  const ignoreAuthEvents = useRef(false);
  const currentUserRef = useRef<User | null>(null);

  const setIgnoreAuthEvents = (ignore: boolean) => {
    ignoreAuthEvents.current = ignore;
  };

  const loadUserProfile = async (token: string) => {
    try {
      const userProfile = await authService.getCurrentUser();
      
      if (userProfile) {
        currentUserRef.current = userProfile;
        setState({
          token,
          user: userProfile,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setState(s => ({ ...s, isLoading: false, isAuthenticated: false }));
      }
    } catch (err) {
      console.error("[AuthContext] Profile load failed:", err);
      setState(s => ({ ...s, isLoading: false }));
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          await loadUserProfile(session.access_token);
        } else {
          setState(s => ({ ...s, isLoading: false, isAuthenticated: false }));
        }
      } catch (err) {
        console.error("[AuthContext] Init error:", err);
        setState(s => ({ ...s, isLoading: false }));
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (ignoreAuthEvents.current) return;
      
      if (session) {
        if (currentUserRef.current?.id === session.user.id) return;
        await loadUserProfile(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        currentUserRef.current = null;
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
      const result = await authService.login(email, pass);
      if (result.user) {
        currentUserRef.current = result.user;
        setState({
          user: result.user,
          token: result.session?.access_token || 'demo-token',
          isAuthenticated: true,
          isLoading: false
        });
      }
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
    
    const updatedUser = { ...state.user, ...data };
    currentUserRef.current = updatedUser;
    setState(s => ({ ...s, user: updatedUser }));
  };

  const logout = async () => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      await authService.logout();
    } finally {
      currentUserRef.current = null;
      setState({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile, setIgnoreAuthEvents }}>
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