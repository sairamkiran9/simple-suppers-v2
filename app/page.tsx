'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import MealPlanCard from '@/components/MealPlanCard';
import MealPlanDetail from '@/components/MealPlanDetail';
import SubscriptionModal from '@/components/SubscriptionModal';
import Dashboard from '@/components/Dashboard';
import ProviderDashboard from '@/components/ProviderDashboard';
import Footer from '@/components/Footer';
import { ViewType, MealPlan } from '@/lib/types';
import { sampleData } from '@/lib/data';
import { showSuccessNotification } from '@/lib/utils';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    setSelectedMealPlan(null);
  };

  const handleViewDetails = (planId: number) => {
    const plan = sampleData.sampleMealPlans.find(p => p.id === planId);
    if (plan) {
      setSelectedMealPlan(plan);
      setCurrentView('detail');
    }
  };

  const handleSubscribe = (planId: number) => {
    const plan = sampleData.sampleMealPlans.find(p => p.id === planId);
    if (plan) {
      setSelectedMealPlan(plan);
      setIsModalOpen(true);
    }
  };

  const handleConfirmSubscription = () => {
    if (selectedMealPlan) {
      showSuccessNotification(`Successfully subscribed to ${selectedMealPlan.title}!`);
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
        return (
          <div className="container">
            <div className="page-header">
              <h1>Browse Meal Plans</h1>
              <p>Find the perfect meal plan for your lifestyle and budget</p>
            </div>
            <div className="meal-plans-grid">
              {sampleData.sampleMealPlans.map((plan) => (
                <MealPlanCard
                  key={plan.id}
                  plan={plan}
                  onViewDetails={handleViewDetails}
                  onSubscribe={handleSubscribe}
                />
              ))}
            </div>
          </div>
        );

      case 'detail':
        return selectedMealPlan ? (
          <MealPlanDetail
            plan={selectedMealPlan}
            onBack={() => handleViewChange('browse')}
            onSubscribe={handleSubscribe}
          />
        ) : null;

      case 'provider':
        return <ProviderDashboard />;

      case 'dashboard':
        return <Dashboard />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation currentView={currentView} onViewChange={handleViewChange} />
      
      <main>
        {renderCurrentView()}
      </main>

      <Footer />

      <SubscriptionModal
        isOpen={isModalOpen}
        plan={selectedMealPlan}
        onClose={handleCloseModal}
        onConfirm={handleConfirmSubscription}
      />
    </div>
  );
}