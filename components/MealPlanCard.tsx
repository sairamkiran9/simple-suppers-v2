'use client';

import { ApiMealPlan } from '@/lib/api-types';
import { generateStars } from '@/lib/utils';

interface MealPlanCardProps {
  plan: ApiMealPlan;
  onViewDetails: (planId: string) => void;
  onSubscribe: (planId: string) => void;
  onUnsubscribe?: (purchaseId: string, planId: string) => void;
}

export default function MealPlanCard({ plan, onViewDetails, onSubscribe, onUnsubscribe }: MealPlanCardProps) {
  const stars = generateStars(plan.average_rating);
  const isSubscribed = plan.user_has_subscribed === true;
  const hasRating = plan.average_rating > 0;

  return (
    <div
      className="meal-plan-card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onViewDetails(plan.id)}
    >
      <div className="meal-plan-header">
        <div className="flex items-start justify-between">
          <h3 className="meal-plan-title">{plan.title}</h3>
          <div className="flex gap-1 flex-wrap">
            {plan.is_free && <span className="badge badge--free">Free</span>}
            {plan.is_featured && <span className="badge badge--featured">Featured</span>}
            {isSubscribed && <span className="badge badge--featured">Subscribed</span>}
          </div>
        </div>
        <p className="meal-plan-provider">by {plan.provider.name || plan.provider.business_name || 'Unknown Provider'}</p>
        <div className="meal-plan-meta">
          <div className="meal-plan-price">
            {plan.is_free ? 'Free' : `$${plan.final_price.toFixed(2)}`}
          </div>
          {hasRating && (
            <div className="meal-plan-rating">
              <span className="stars">{stars}</span>
              <span>{plan.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="meal-plan-body">
        <div className="meal-plan-tags">
          {plan.dietary_tags.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
        <p>{plan.description}</p>
        <div className="meal-plan-stats">
          {plan.total_purchases > 0 && <span>{plan.total_purchases} purchases</span>}
          {plan.category && <span>{plan.category}</span>}
          <span>{plan.duration_days} days</span>
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
          {isSubscribed && plan.user_purchase_id && onUnsubscribe ? (
            <button
              className="btn btn--outline btn--sm"
              onClick={(e) => {
                e.stopPropagation();
                onUnsubscribe(plan.user_purchase_id!, plan.id);
              }}
            >
              Unsubscribe
            </button>
          ) : (
            <button
              className="btn btn--primary btn--sm"
              onClick={(e) => {
                e.stopPropagation();
                onSubscribe(plan.id);
              }}
            >
              Subscribe
            </button>
          )}
        </div>
      </div>
    </div>
  );
}