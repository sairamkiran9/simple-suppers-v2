'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import MealPlanCard from '@/components/MealPlanCard';
import MealPlanDetail from '@/components/MealPlanDetail';
import SubscriptionModal from '@/components/SubscriptionModal';
import AuthModal from '@/components/AuthModal';
import Dashboard from '@/components/Dashboard';
import ProviderDashboard from '@/components/ProviderDashboard';
import Footer from '@/components/Footer';
import { ViewType } from '@/lib/types';
import { showSuccessNotification } from '@/lib/utils';
import { useMealPlans } from '@/hooks/useMealPlans';
import { useMealPlanDetail } from '@/hooks/useMealPlanDetail';
import { useAuth } from '@/lib/auth-context';
import type { ApiMealPlan, ApiMealPlanDetail } from '@/lib/api-types';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [viewOrigin, setViewOrigin] = useState<'browse' | 'dashboard'>('browse');

  // Fetch meal plans for browse view
  const { data: mealPlansData, isLoading: isLoadingPlans, error: plansError } = useMealPlans(
    {},
    { enabled: currentView === 'browse' || currentView === 'detail' }
  );

  // Fetch selected meal plan detail
  const { data: selectedMealPlan, isLoading: isLoadingDetail, error: detailError } = useMealPlanDetail(
    selectedPlanId || '',
    { enabled: currentView === 'detail' && !!selectedPlanId }
  );

  const handleViewChange = (view: ViewType) => {
    // Check authentication for protected routes
    if (view === 'dashboard' && (!isAuthenticated || user?.user_type !== 'user')) {
      setIsAuthModalOpen(true);
      return;
    }

    if (view === 'provider' && (!isAuthenticated || user?.user_type !== 'provider')) {
      setIsAuthModalOpen(true);
      return;
    }

    setCurrentView(view);
    setSelectedPlanId(null);
  };

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
  };

  const handleViewDetails = (planId: string, origin: 'browse' | 'dashboard' = 'browse') => {
    setSelectedPlanId(planId);
    setViewOrigin(origin);
    setCurrentView('detail');
  };

  const handleSubscribe = (planId: string) => {
    setSelectedPlanId(planId);
    setIsModalOpen(true);
  };

  const handleConfirmSubscription = () => {
    const plan = selectedMealPlan || mealPlansData?.meal_plans.find(p => p.id === selectedPlanId);
    if (plan) {
      showSuccessNotification(`Successfully subscribed to ${plan.title}!`);
      setIsModalOpen(false);
      setCurrentView('dashboard');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return (
          <>
            <Hero onViewChange={handleViewChange} />
            <Features />
            <Pricing onViewChange={handleViewChange} />
          </>
        );
      
      case 'browse':
        if (isLoadingPlans) {
          return (
            <div className="container">
              <div className="page-header">
                <h1>Browse Meal Plans</h1>
                <p>Loading meal plans...</p>
              </div>
            </div>
          );
        }

        if (plansError) {
          return (
            <div className="container">
              <div className="page-header">
                <h1>Browse Meal Plans</h1>
                <p className="error">Error: {plansError}</p>
              </div>
            </div>
          );
        }

        return (
          <div className="container">
            <div className="page-header">
              <h1>Browse Meal Plans</h1>
              <p>Find the perfect meal plan for your lifestyle and budget</p>
            </div>
            <div className="meal-plans-grid">
              {mealPlansData?.meal_plans.map((plan) => (
                <MealPlanCard
                  key={plan.id}
                  plan={plan}
                  onViewDetails={handleViewDetails}
                  onSubscribe={handleSubscribe}
                />
              ))}
              {mealPlansData?.meal_plans.length === 0 && (
                <p>No meal plans available at this time.</p>
              )}
            </div>
          </div>
        );

      case 'detail':
        if (isLoadingDetail) {
          return (
            <div className="container">
              <p>Loading meal plan details...</p>
            </div>
          );
        }

        if (detailError) {
          return (
            <div className="container">
              <p className="error">Error: {detailError}</p>
              <button className="btn btn--outline" onClick={() => handleViewChange('browse')}>
                Back to Browse
              </button>
            </div>
          );
        }

        return selectedMealPlan ? (
          <MealPlanDetail
            plan={selectedMealPlan}
            onBack={() => handleViewChange(viewOrigin)}
            onSubscribe={handleSubscribe}
          />
        ) : null;

      case 'provider':
        return <ProviderDashboard />;

      case 'dashboard':
        return <Dashboard onViewMealPlan={handleViewDetails} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation
        currentView={currentView}
        onViewChange={handleViewChange}
        onLoginClick={handleLoginClick}
      />

      <main>
        {renderCurrentView()}
      </main>

      <Footer />

      <SubscriptionModal
        isOpen={isModalOpen}
        plan={
          selectedMealPlan ||
          mealPlansData?.meal_plans.find(p => p.id === selectedPlanId) ||
          null
        }
        onClose={handleCloseModal}
        onConfirm={handleConfirmSubscription}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleAuthModalClose}
      />
    </div>
  );
}