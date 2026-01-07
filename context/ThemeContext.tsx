import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setIsDarkMode: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark-mode');
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark-mode');
      } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark-mode');
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark-mode');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply theme changes to the DOM
  useEffect(() => {
    if (isLoading) return;
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
      localStorage.setItem('app-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('app-theme', 'light');
    }
  }, [isDarkMode, isLoading]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setIsDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};