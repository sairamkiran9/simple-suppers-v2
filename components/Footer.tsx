'use client';

import { Utensils } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <Utensils size={20} />
            <span>Simple Suppers</span>
          </div>
          <div className="footer-links">
            <a href="#">About</a>
            <a href="#">Help</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Simple Suppers. Made with ❤️ for real families on real budgets.</p>
        </div>
      </div>
    </footer>
  );
}