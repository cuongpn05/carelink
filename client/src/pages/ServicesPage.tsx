import React from 'react';
import { Navbar } from '../components/Header/Navbar';
import { Footer } from '../components/Footer/Footer';
import { ServiceCategories } from '../components/Services/ServiceCategories';
import { TrustBanner } from '../components/Trust/TrustBanner';

export const ServicesPage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <main style={{ padding: '30px 0' }}>
        <div className="container" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
            Tất cả dịch vụ CareLink
          </h1>
          <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
            Chúng tôi cung cấp các gói dịch vụ chăm sóc đa dạng, tận tâm và đạt chuẩn chuyên môn y tế.
          </p>
        </div>
        <ServiceCategories />
        <TrustBanner />
      </main>
      <Footer />
    </div>
  );
};

