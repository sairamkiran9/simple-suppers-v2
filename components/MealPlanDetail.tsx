'use client';

import { ArrowLeft } from 'lucide-react';
import { MealPlan, ViewType } from '@/lib/types';
import { generateStars } from '@/lib/utils';

interface MealPlanDetailProps {
  plan: MealPlan;
  onBack: () => void;
  onSubscribe: (planId: number) => void;
}

export default function MealPlanDetail({ plan, onBack, onSubscribe }: MealPlanDetailProps) {
  const stars = generateStars(plan.rating);

  const daysGrid = Object.entries(plan.meals).map(([day, meals]) => (
    <div key={day} className="day-card">
      <div className="day-name">{day}</div>
      <div className="meal-item">
        <div className="meal-label">Dinner:</div>
        <div>{meals.dinner}</div>
      </div>
      <div className="meal-item">
        <div className="meal-label">Lunch:</div>
        <div>{meals.lunch}</div>
      </div>
    </div>
  ));

  return (
    <div className="container">
      <button className="btn btn--outline back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Back to Plans
      </button>
      
      <div className="meal-plan-detail-header">
        <div className="detail-info">
          <h1>{plan.title}</h1>
          <div className="detail-meta">
            <span>by {plan.provider}</span>
            <div className="meal-plan-rating">
              <span className="stars">{stars}</span>
              <span>{plan.rating}</span>
            </div>
            <span>{plan.subscribers} subscribers</span>
          </div>
          <div className="meal-plan-tags">
            {plan.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
          <p>{plan.description}</p>
        </div>
        <div className="detail-actions">
          <div className="meal-plan-price" style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-16)' }}>
            ${plan.price}/mo
          </div>
          <button 
            className="btn btn--primary btn--lg"
            onClick={() => onSubscribe(plan.id)}
          >
            Subscribe Now
          </button>
          <button className="btn btn--outline btn--lg" style={{ marginTop: 'var(--space-8)' }}>
            Download Sample
          </button>
        </div>
      </div>
      
      <div className="weekly-menu">
        <h3>Weekly Menu</h3>
        <div className="days-grid">{daysGrid}</div>
      </div>
      
      <div className="dashboard-card">
        <h3>What&apos;s Included</h3>
        <ul>
          <li>7 dinner recipes with step-by-step instructions</li>
          <li>7 lunch ideas using leftovers and simple ingredients</li>
          <li>Complete shopping list organized by store section</li>
          <li>Estimated total grocery cost breakdown</li>
          <li>Tips for meal prep and storage</li>
        </ul>
        <button className="btn btn--outline">Download Shopping List (PDF)</button>
      </div>
    </div>
  );
}