
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User, AuthState, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: (role?: UserRole) => Promise<void>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await authService.getCurrentUser();
          const token = await firebaseUser.getIdToken();
          
          setState({
            user: profile,
            token: token,
            isAuthenticated: !!profile,
            isLoading: false
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const result = await authService.login(email, pass);
      setState({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      setState(s => ({ ...s, isLoading: false }));
      throw err;
    }
  };

  const loginWithGoogle = async (role?: UserRole) => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const result = await authService.loginWithGoogle(role);
      setState({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      setState(s => ({ ...s, isLoading: false }));
      throw err;
    }
  };

  const register = async (data: any) => {
    setState(s => ({ ...s, isLoading: true }));
    try {
      const result = await authService.register(data);
      setState({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isLoading: false
      });
      return result;
    } catch (err) {
      setState(s => ({ ...s, isLoading: false }));
      throw err;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!state.user) return;
    const updatedUser = { ...state.user, ...data };
    setState(s => ({ ...s, user: updatedUser }));
    // Fix: update standardize key for recovery
    localStorage.setItem('nextlearn_active_session', JSON.stringify(updatedUser));
  };

  const logout = async () => {
    await authService.logout();
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  };

  const setIgnoreAuthEvents = () => {};

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, register, logout, updateProfile, setIgnoreAuthEvents }}>
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
