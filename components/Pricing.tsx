'use client';

import { Check } from 'lucide-react';
import { ViewType } from '@/lib/types';

interface PricingProps {
  onViewChange: (view: ViewType) => void;
}

export default function Pricing({ onViewChange }: PricingProps) {
  const features = [
    'Access to all meal plans',
    'Weekly shopping lists',
    'Recipe instructions',
    'Cancel anytime'
  ];

  return (
    <div className="pricing">
      <div className="container">
        <h2>Simple Pricing</h2>
        <div className="pricing-card">
          <div className="pricing-header">
            <h3>Base Subscription</h3>
            <div className="price">$6<span>/month</span></div>
          </div>
          <div className="pricing-features">
            <ul>
              {features.map((feature, index) => (
                <li key={index}>
                  <Check size={16} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <button 
            className="btn btn--primary btn--full-width"
            onClick={() => onViewChange('browse')}
          >
            Start Your Subscription
          </button>
        </div>
      </div>
    </div>
  );
}