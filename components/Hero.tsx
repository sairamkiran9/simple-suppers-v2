'use client';

import { Star } from 'lucide-react';
import { ViewType } from '@/lib/types';

interface HeroProps {
  onViewChange: (view: ViewType) => void;
}

export default function Hero({ onViewChange }: HeroProps) {
  return (
    <div className="hero-redesigned">
      <div className="hero-background">
        <img 
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
          alt="Delicious home-cooked meal" 
          className="hero-image"
        />
        <div className="hero-overlay" />
      </div>
      <div className="container hero-container">
        <div className="hero-content">
          <h1>Discover meal plans from real home cooks</h1>
          <p>Join a community where families share their favorite recipes and meal planning secrets. Save time, money, and discover new flavors together.</p>
          <div className="hero-actions">
            <button 
              className="btn btn--primary btn--lg"
              onClick={() => onViewChange('browse')}
            >
              Browse Plans
            </button>
            <button 
              className="btn btn--outline btn--lg hero-secondary-btn"
              onClick={() => onViewChange('provider')}
            >
              Join Community
            </button>
          </div>
          <div className="hero-social-proof">
            <p className="social-proof-text">Join 2,500+ families saving time & money</p>
            <div className="testimonial">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="star-filled" data-testid="star-icon" />
                ))}
              </div>
              <p className="testimonial-quote">"Changed how we do dinners" - Sarah M.</p>
              <div className="testimonial-avatar">
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80" 
                  alt="Sarah M." 
                  className="avatar"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}