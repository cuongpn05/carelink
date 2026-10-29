import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Header/Navbar';
import { HeroBanner } from '../components/Hero/HeroBanner';
import { ServiceCategories } from '../components/Services/ServiceCategories';
import { FeaturedCaregivers } from '../components/Caregivers/FeaturedCaregivers';
import { TrustBanner } from '../components/Trust/TrustBanner';
import { Footer } from '../components/Footer/Footer';
import { CaregiverDetailModal } from '../components/Modal/CaregiverDetailModal';
import { Caregiver, ServiceCategory } from '../types';
import toast from 'react-hot-toast';

export const HomePage: React.FC = () => {
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);

  const navigate = useNavigate();

  const handleOpenAuth = (mode: 'login' | 'register') => {
    navigate(`/auth?mode=${mode}`);
  };

  const handleSelectCategory = (category: ServiceCategory) => {
    toast(`Đang chuyển đến danh sách người chăm sóc cho dịch vụ "${category.title}"...`, {
      icon: '🔍',
    });
    navigate(`/caregivers?service=${category.id}`);
  };

  const handleViewCaregiverDetails = (caregiver: Caregiver) => {
    setSelectedCaregiver(caregiver);
  };

  return (
    <div className="home-page-layout">
      {/* 1. Header — Thanh điều hướng */}
      <Navbar />

      {/* Main Content */}
      <main>
        {/* 2. Hero Banner — Giới thiệu nền tảng */}
        <HeroBanner />

        {/* 3. Danh mục dịch vụ */}
        <ServiceCategories onSelectCategory={handleSelectCategory} />

        {/* 4. Người chăm sóc nổi bật */}
        <FeaturedCaregivers onViewDetails={handleViewCaregiverDetails} />

        {/* 5. Khu vực tạo niềm tin */}
        <TrustBanner />
      </main>

      {/* Footer */}
      <Footer />

      {/* Caregiver Profile Detail Modal */}
      <CaregiverDetailModal
        caregiver={selectedCaregiver}
        onClose={() => setSelectedCaregiver(null)}
      />
    </div>
  );
};

