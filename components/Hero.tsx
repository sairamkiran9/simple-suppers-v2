'use client';

import { Calendar } from 'lucide-react';
import { ViewType } from '@/lib/types';

interface HeroProps {
  onViewChange: (view: ViewType) => void;
}

export default function Hero({ onViewChange }: HeroProps) {
  return (
    <div className="hero">
      <div className="container">
        <div className="hero-content">
          <h1>Meal Planning Made Simple</h1>
          <p>Subscribe to meal plans created by real people for real budgets. Get weekly menus, shopping lists, and cooking tips starting at just $6/month.</p>
          <div className="hero-actions">
            <button 
              className="btn btn--primary btn--lg"
              onClick={() => onViewChange('browse')}
            >
              Browse Meal Plans
            </button>
            <button 
              className="btn btn--outline btn--lg"
              onClick={() => onViewChange('provider')}
            >
              Become a Provider
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-card">
            <Calendar size={24} />
            <span>Weekly Plans</span>
          </div>
        </div>
      </div>
    </div>
  );
}