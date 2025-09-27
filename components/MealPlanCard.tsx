'use client';

import { MealPlan } from '@/lib/types';
import { generateStars } from '@/lib/utils';

interface MealPlanCardProps {
  plan: MealPlan;
  onViewDetails: (planId: number) => void;
  onSubscribe: (planId: number) => void;
}

export default function MealPlanCard({ plan, onViewDetails, onSubscribe }: MealPlanCardProps) {
  const stars = generateStars(plan.rating);
  
  return (
    <div 
      className="meal-plan-card"
      onClick={() => onViewDetails(plan.id)}
    >
      <div className="meal-plan-header">
        <h3 className="meal-plan-title">{plan.title}</h3>
        <p className="meal-plan-provider">by {plan.provider}</p>
        <div className="meal-plan-meta">
          <div className="meal-plan-price">${plan.price}/mo</div>
          <div className="meal-plan-rating">
            <span className="stars">{stars}</span>
            <span>{plan.rating}</span>
          </div>
        </div>
      </div>
      <div className="meal-plan-body">
        <div className="meal-plan-tags">
          {plan.tags.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
        <p>{plan.description}</p>
        <div className="meal-plan-stats">
          <span>{plan.subscribers} subscribers</span>
          <span>{plan.category}</span>
        </div>
        <div className="meal-plan-actions">
          <button 
            className="btn btn--outline btn--sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(plan.id);
            }}
          >
            View Details
          </button>
          <button 
            className="btn btn--primary btn--sm"
            onClick={(e) => {
              e.stopPropagation();
              onSubscribe(plan.id);
            }}
          >
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}