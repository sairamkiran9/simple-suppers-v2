'use client';

import { Utensils } from 'lucide-react';
import { ViewType } from '@/lib/types';
import ThemeToggle from './ThemeToggle';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const navItems = [
    { view: 'landing' as ViewType, label: 'Home' },
    { view: 'browse' as ViewType, label: 'Browse Plans' },
    { view: 'provider' as ViewType, label: 'For Providers' },
    { view: 'dashboard' as ViewType, label: 'My Account' },
  ];

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
                  onClick={() => onViewChange(item.view)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}