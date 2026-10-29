import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Header/Navbar';
import { Footer } from '../components/Footer/Footer';
import { FeaturedCaregivers } from '../components/Caregivers/FeaturedCaregivers';
import { CaregiverDetailModal } from '../components/Modal/CaregiverDetailModal';
import { Caregiver } from '../types';

export const CaregiversPage: React.FC = () => {
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [searchParams] = useSearchParams();
  const serviceFilter = searchParams.get('service');

  return (
    <div>
      <Navbar />
      <main style={{ padding: '30px 0' }}>
        <div className="container" style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
            Đội ngũ người chăm sóc
          </h1>
          <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
            {serviceFilter
              ? `Đang lọc danh sách người chăm sóc phù hợp với nhu cầu của bạn.`
              : `Tất cả nhân sự điều dưỡng và chăm sóc viên đều được xác minh hồ sơ và đào tạo bài bản.`}
          </p>
        </div>
        <FeaturedCaregivers onViewDetails={(cg) => setSelectedCaregiver(cg)} />
      </main>
      <Footer />
      <CaregiverDetailModal
        caregiver={selectedCaregiver}
        onClose={() => setSelectedCaregiver(null)}
      />
    </div>
  );
};

