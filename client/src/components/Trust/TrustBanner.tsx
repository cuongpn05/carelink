import React from 'react';
import { ShieldCheck, Clock, Users, Headphones } from 'lucide-react';
import { trustFeatures } from '../../data/mockData';
import { TrustFeature } from '../../types';
import './TrustBanner.css';

export const TrustBanner: React.FC = () => {
  const renderIcon = (type: TrustFeature['iconType']) => {
    switch (type) {
      case 'shield':
        return <ShieldCheck size={24} className="trust-icon" />;
      case 'clock':
        return <Clock size={24} className="trust-icon" />;
      case 'users':
        return <Users size={24} className="trust-icon" />;
      case 'headphone':
        return <Headphones size={24} className="trust-icon" />;
      default:
        return <ShieldCheck size={24} className="trust-icon" />;
    }
  };

  return (
    <section className="trust-section">
      <div className="container">
        <div className="trust-banner-box">
          <div className="trust-grid">
            {trustFeatures.map((item) => (
              <div key={item.id} className="trust-item">
                <div className="trust-icon-wrapper">
                  {renderIcon(item.iconType)}
                </div>
                <div className="trust-text-content">
                  <h4 className="trust-title">{item.title}</h4>
                  <p className="trust-desc">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

