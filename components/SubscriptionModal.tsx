'use client';

import { X } from 'lucide-react';
import { MealPlan } from '@/lib/types';

interface SubscriptionModalProps {
  isOpen: boolean;
  plan: MealPlan | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SubscriptionModal({ isOpen, plan, onClose, onConfirm }: SubscriptionModalProps) {
  if (!isOpen || !plan) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal">
      <div className="modal-overlay" onClick={handleOverlayClick}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Subscribe to Plan</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <p>Ready to subscribe to <strong>{plan.title}</strong>?</p>
          <div className="subscription-preview">
            <div className="preview-item">
              <span>Monthly cost:</span>
              <strong>${plan.price}/month</strong>
            </div>
            <div className="preview-item">
              <span>Provider:</span>
              <strong>{plan.provider}</strong>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={onConfirm}>
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  );
}