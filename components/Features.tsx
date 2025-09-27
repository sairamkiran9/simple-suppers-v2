'use client';

import { DollarSign, SquareCheck as CheckSquare, Users } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <DollarSign size={24} />,
      title: 'Budget-Friendly',
      description: 'Plans starting at $6/month with meals designed for tight budgets'
    },
    {
      icon: <CheckSquare size={24} />,
      title: 'Shopping Lists',
      description: 'Organized shopping lists with estimated costs for easy grocery runs'
    },
    {
      icon: <Users size={24} />,
      title: 'Real People',
      description: 'Created by moms, students, and home cooks who understand your challenges'
    }
  ];

  return (
    <div className="features">
      <div className="container">
        <h2>Why Choose Simple Suppers?</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}