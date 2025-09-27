'use client';

export default function Dashboard() {
  return (
    <div className="container">
      <div className="page-header">
        <h1>My Account</h1>
        <p>Manage your subscriptions and account settings</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Current Subscriptions</h3>
          <div className="subscription-item">
            <div className="subscription-info">
              <h4>Quick & Cheap Weekly Meals</h4>
              <p>by Mom of Five Kitchen</p>
              <div className="subscription-meta">
                <span className="status status--success">Active</span>
                <span className="price">$6/month</span>
              </div>
            </div>
            <div className="subscription-actions">
              <button className="btn btn--outline btn--sm">Download This Week</button>
              <button className="btn btn--secondary btn--sm">Cancel</button>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Billing Information</h3>
          <div className="billing-info">
            <div className="billing-item">
              <span>Next billing date:</span>
              <strong>October 25, 2025</strong>
            </div>
            <div className="billing-item">
              <span>Payment method:</span>
              <strong>**** **** **** 1234</strong>
            </div>
            <div className="billing-item">
              <span>Monthly total:</span>
              <strong>$6.00</strong>
            </div>
          </div>
          <button className="btn btn--outline">Update Payment Method</button>
        </div>
      </div>
    </div>
  );
}