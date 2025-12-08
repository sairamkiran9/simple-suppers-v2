'use client';

import { X } from 'lucide-react';
import { ApiMealPlan, ApiMealPlanDetail } from '@/lib/api-types';

interface SubscriptionModalProps {
  isOpen: boolean;
  plan: ApiMealPlan | ApiMealPlanDetail | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function SubscriptionModal({ isOpen, plan, onClose, onConfirm, isLoading = false }: SubscriptionModalProps) {
  if (!isOpen || !plan) return null;

  // Debug logging to understand data structure issues
  if (!plan.provider) {
    console.warn('SubscriptionModal: plan.provider is missing', { plan });
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Defensive handling for missing provider data with multiple fallbacks
  const providerData = plan.provider || (plan as any).creator;
  const providerName = providerData?.creator_display_name ||
                       providerData?.name ||
                       providerData?.business_name ||
                       'Unknown Provider';
  const isFree = 'is_free' in plan ? plan.is_free : false;

  return (
    <div className="modal">
      <div className="modal-overlay" onClick={handleOverlayClick}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{isFree ? 'Get Free Plan' : 'Subscribe to Plan'}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <p>Ready to {isFree ? 'get' : 'subscribe to'} <strong>{plan.title}</strong>?</p>
          <div className="subscription-preview">
            <div className="preview-item">
              <span>Cost:</span>
              <strong>{isFree ? 'Free' : `$${plan.final_price.toFixed(2)}`}</strong>
            </div>
            <div className="preview-item">
              <span>Provider:</span>
              <strong>{providerName}</strong>
            </div>
            <div className="preview-item">
              <span>Duration:</span>
              <strong>{plan.duration_days} days</strong>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn--outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : isFree ? 'Get Free Plan' : 'Subscribe Now'}
          </button>
        </div>
      </div>
    </div>
  );
}