'use client';

import { useState } from 'react';
import { sampleData } from '@/lib/data';

export default function ProviderDashboard() {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: 'Budget-Friendly',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally submit to an API
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

  const providerPlans = sampleData.sampleMealPlans.slice(0, 2);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Provider Dashboard</h1>
        <p>Manage your meal plans and track your earnings</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-number">3</div>
              <div className="stat-label">Active Plans</div>
            </div>
            <div className="stat">
              <div className="stat-number">234</div>
              <div className="stat-label">Total Subscribers</div>
            </div>
            <div className="stat">
              <div className="stat-number">$1,247</div>
              <div className="stat-label">Monthly Earnings</div>
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

      <div className="dashboard-card">
        <h3>Your Meal Plans</h3>
        <div className="plans-list">
          {providerPlans.map((plan) => (
            <div key={plan.id} className="provider-plan-item">
              <div className="plan-info">
                <h4>{plan.title}</h4>
                <div className="plan-stats">
                  <span>{plan.subscribers} subscribers</span>
                  <span>${plan.price}/month</span>
                  <span className="stars">★{plan.rating}</span>
                </div>
              </div>
              <div className="plan-actions">
                <button className="btn btn--outline btn--sm">Edit</button>
                <button className="btn btn--secondary btn--sm">Pause</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}