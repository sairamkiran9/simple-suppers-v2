'use client';

import { ArrowLeft } from 'lucide-react';
import { ApiMealPlanDetail } from '@/lib/api-types';
import { generateStars } from '@/lib/utils';

interface MealPlanDetailProps {
  plan: ApiMealPlanDetail;
  onBack: () => void;
  onSubscribe: (planId: string) => void;
}

export default function MealPlanDetail({ plan, onBack, onSubscribe }: MealPlanDetailProps) {
  // Defensive null checks for provider data
  if (!plan.provider) {
    console.error('MealPlanDetail: Provider data is missing', plan);
    return (
      <div className="container">
        <button className="btn btn--outline back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Plans
        </button>
        <div className="dashboard-card">
          <h3>Error Loading Meal Plan</h3>
          <p>Provider information is missing. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Use provider rating if available, otherwise default to 0
  const providerRating = plan.provider.rating || 0;
  const stars = generateStars(providerRating);

  // Generate days grid from meal_plan_days
  const daysGrid = plan.meal_plan_days?.map((day) => (
    <div key={day.id || day.day_number} className="day-card">
      <div className="day-name">
        {day.day_title || `Day ${day.day_number}`}
      </div>
      {day.meals.map((meal, idx) => (
        <div key={idx} className="meal-item">
          <div className="meal-label">{meal.meal_type}:</div>
          <div>{meal.meal_name}</div>
          {meal.prep_time_minutes && (
            <div className="meal-time">Prep: {meal.prep_time_minutes}min</div>
          )}
        </div>
      ))}
    </div>
  ));

  return (
    <div className="container">
      <button className="btn btn--outline back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Back to Plans
      </button>

      <div className="meal-plan-detail-header">
        <div className="detail-info">
          <h1>
            {plan.title}
            {plan.is_free && <span className="badge badge--free">Free</span>}
          </h1>
          <div className="detail-meta">
            <span>by {plan.provider.name || plan.provider.business_name || 'Unknown Provider'}</span>
            {providerRating > 0 && (
              <div className="meal-plan-rating">
                <span className="stars">{stars}</span>
                <span>{providerRating.toFixed(1)}</span>
              </div>
            )}
            {plan.difficulty_level && <span>{plan.difficulty_level} difficulty</span>}
          </div>
          {plan.dietary_tags && plan.dietary_tags.length > 0 && (
            <div className="meal-plan-tags">
              {plan.dietary_tags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          )}
          <p>{plan.description}</p>
        </div>
        <div className="detail-actions">
          <div className="meal-plan-price" style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-16)' }}>
            {plan.is_free ? 'Free' : `$${plan.final_price.toFixed(2)}`}
          </div>
          <button
            className="btn btn--primary btn--lg"
            onClick={() => onSubscribe(plan.id)}
          >
            {plan.is_free ? 'Get Free Plan' : 'Subscribe Now'}
          </button>
          <button className="btn btn--outline btn--lg" style={{ marginTop: 'var(--space-8)' }}>
            Download Sample
          </button>
        </div>
      </div>

      {plan.meal_plan_days && plan.meal_plan_days.length > 0 && (
        <div className="weekly-menu">
          <h3>{plan.duration_type || 'Meal Plan'} Menu ({plan.duration_days} days)</h3>
          <div className="days-grid">{daysGrid}</div>
        </div>
      )}

      <div className="dashboard-card">
        <h3>What&apos;s Included</h3>
        <ul>
          <li>{plan.meal_plan_days?.length || 0} days of detailed meal plans</li>
          <li>Complete recipes with step-by-step instructions</li>
          <li>Shopping list organized by store section</li>
          <li>Nutritional information and serving sizes</li>
          <li>Tips for meal prep and storage</li>
        </ul>
        <button className="btn btn--outline">Download Shopping List (PDF)</button>
      </div>
    </div>
  );
}