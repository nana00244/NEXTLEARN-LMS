import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Automatically close sidebar on route change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-950">{children}</div>;
  }

  return (
    <div className="app-container">
      {/* Sidebar - Phase 5 Responsive */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[150] md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="main-content">
        {/* Top Navigation - Standardized */}
        <Navbar onMenuToggle={toggleSidebar} />
        
        <main className="page-container">
          <div className="animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};