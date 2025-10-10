'use client';

import { useState } from 'react';
import { useProviderDashboard } from '@/hooks/useProviderDashboard';
import { useProviderMealPlans } from '@/hooks/useProviderMealPlans';
import { useProviderMealPlanActions } from '@/hooks/useProviderMealPlanActions';

export default function ProviderDashboard() {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: 'Budget-Friendly',
    description: ''
  });

  // Fetch dashboard data
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    error: dashboardError
  } = useProviderDashboard();

  // Fetch meal plans
  const {
    data: mealPlans,
    isLoading: isPlansLoading,
    error: plansError,
    isEmpty,
    refetch
  } = useProviderMealPlans();

  // Meal plan actions
  const {
    updateMealPlan,
    deleteMealPlan,
    isUpdating,
    isDeleting
  } = useProviderMealPlanActions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement create meal plan when backend endpoint is ready
    alert('Meal plan uploaded successfully! It will be reviewed within 24 hours.');
    setFormData({
      title: '',
      price: '',
      category: 'Budget-Friendly',
      description: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      await updateMealPlan(id, { is_published: !isPublished });
      refetch();
    } catch (error) {
      // Error already handled by hook with toast
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateMealPlan(id, { is_active: !isActive });
      refetch();
    } catch (error) {
      // Error already handled by hook with toast
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this meal plan? This action cannot be undone.')) {
      try {
        await deleteMealPlan(id);
        refetch();
      } catch (error) {
        // Error already handled by hook with toast
      }
    }
  };

  // Loading state
  if (isDashboardLoading || isPlansLoading) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Provider Dashboard</h1>
          <p>Loading your dashboard...</p>
        </div>
        <div className="dashboard-card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (dashboardError || plansError) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Provider Dashboard</h1>
          <p>There was a problem loading your dashboard</p>
        </div>
        <div className="dashboard-card">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">
              Error: {dashboardError || plansError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn--primary mt-4"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state (shouldn't happen if API is working)
  if (!dashboard) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Provider Dashboard</h1>
          <p>No dashboard data available</p>
        </div>
        <div className="dashboard-card">
          <p className="text-center py-12 text-gray-600 dark:text-gray-400">
            No dashboard data found. Please contact support if this persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Provider Dashboard</h1>
        <p>Welcome back, {dashboard.provider.business_name}</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-number">{dashboard.analytics.published_plans}</div>
              <div className="stat-label">Active Plans</div>
            </div>
            <div className="stat">
              <div className="stat-number">{dashboard.analytics.total_sales}</div>
              <div className="stat-label">Total Sales</div>
            </div>
            <div className="stat">
              <div className="stat-number">
                ${dashboard.analytics.current_month_earnings.toFixed(2)}
              </div>
              <div className="stat-label">This Month</div>
            </div>
            <div className="stat">
              <div className="stat-number">
                ${dashboard.analytics.all_time_earnings.toFixed(2)}
              </div>
              <div className="stat-label">All Time Earnings</div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Upload New Meal Plan</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Plan Title</label>
              <input
                type="text"
                name="title"
                className="form-control"
                placeholder="e.g., Quick Weeknight Dinners"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Price per Month</label>
              <input
                type="number"
                name="price"
                className="form-control"
                placeholder="6"
                min="1"
                max="50"
                value={formData.price}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option>Budget-Friendly</option>
                <option>Dietary</option>
                <option>Family</option>
                <option>Quick & Easy</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                name="description"
                rows={3}
                placeholder="Describe your meal plan..."
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <button type="submit" className="btn btn--primary">Upload Plan</button>
          </form>
        </div>
      </div>

      {/* Top Performing Plans */}
      {dashboard.top_performing_plans.length > 0 && (
        <div className="dashboard-card">
          <h3>Top Performing Plans</h3>
          <div className="plans-list">
            {dashboard.top_performing_plans.map((plan) => (
              <div key={plan.id} className="provider-plan-item">
                <div className="plan-info">
                  <h4>{plan.title}</h4>
                  <div className="plan-stats">
                    <span>{plan.total_purchases} purchases</span>
                    <span>{plan.total_views} views</span>
                    <span>${plan.final_price.toFixed(2)}</span>
                    <span className="stars">★{plan.average_rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Purchases */}
      {dashboard.recent_purchases.length > 0 && (
        <div className="dashboard-card">
          <h3>Recent Purchases</h3>
          <div className="space-y-3">
            {dashboard.recent_purchases.map((purchase) => (
              <div key={purchase.id} className="provider-plan-item">
                <div className="plan-info">
                  <h4>{purchase.meal_plan_title}</h4>
                  <div className="plan-stats">
                    <span>{purchase.customer_name}</span>
                    <span>Earned: ${purchase.provider_earnings.toFixed(2)}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(purchase.purchased_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Meal Plans */}
      <div className="dashboard-card">
        <h3>Your Meal Plans ({mealPlans?.length || 0})</h3>

        {isEmpty && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              You haven't created any meal plans yet. Use the form above to get started!
            </p>
          </div>
        )}

        {!isEmpty && mealPlans && (
          <div className="plans-list">
            {mealPlans.map((plan) => (
              <div key={plan.id} className="provider-plan-item">
                <div className="plan-info">
                  <h4>
                    {plan.title}
                    {!plan.is_published && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(Draft)</span>
                    )}
                    {!plan.is_active && (
                      <span className="ml-2 text-sm text-orange-500">(Inactive)</span>
                    )}
                  </h4>
                  <div className="plan-stats">
                    <span>{plan.total_purchases} purchases</span>
                    <span>${plan.final_price.toFixed(2)}</span>
                    <span className="stars">★{plan.average_rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="plan-actions">
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={() => handleTogglePublish(plan.id, plan.is_published || false)}
                    disabled={isUpdating || isDeleting}
                  >
                    {plan.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => handleToggleActive(plan.id, plan.is_active || false)}
                    disabled={isUpdating || isDeleting}
                  >
                    {plan.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => handleDelete(plan.id)}
                    disabled={isUpdating || isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
