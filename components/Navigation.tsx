'use client';

import { Utensils, LogOut } from 'lucide-react';
import { ViewType } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import ThemeToggle from './ThemeToggle';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLoginClick: () => void;
}

export default function Navigation({ currentView, onViewChange, onLoginClick }: NavigationProps) {
  const { user, isAuthenticated, logout } = useAuth();

  const handleNavClick = (view: ViewType) => {
    // Check if protected route
    if (view === 'dashboard' && !isAuthenticated) {
      onLoginClick();
      return;
    }

    if (view === 'creator' && (!isAuthenticated || !user?.is_creator)) {
      onLoginClick();
      return;
    }

    onViewChange(view);
  };

  const handleLogout = () => {
    logout();
    onViewChange('landing');
  };

  const navItems = [
    { view: 'landing' as ViewType, label: 'Home', protected: false },
    { view: 'browse' as ViewType, label: 'Browse Plans', protected: false },
    { view: 'feed' as ViewType, label: 'Community', protected: false },
  ];

  // Add My Account only if user is logged in
  if (isAuthenticated) {
    navItems.push({ view: 'dashboard' as ViewType, label: 'My Account', protected: true });
  }

  // Add Creator Dashboard only if user is a creator
  if (isAuthenticated && user?.is_creator) {
    navItems.push({ view: 'creator' as ViewType, label: 'Creator Dashboard', protected: true });
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <div className="nav-brand">
            <Utensils size={24} />
            <span>Simple Suppers</span>
          </div>
          <div className="nav-right">
            <div className="nav-links">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  className={`nav-link ${currentView === item.view ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.view)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {!isAuthenticated ? (
                <button
                  className="nav-link"
                  onClick={onLoginClick}
                >
                  Login
                </button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
