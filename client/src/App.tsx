import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { CaregiversPage } from './pages/CaregiversPage';
import { AboutPage } from './pages/AboutPage';
import { AuthPage } from './pages/AuthPage';
import { BecomeCaregiverPage } from './pages/BecomeCaregiverPage';
import { CaregiverBookingsPage } from './pages/CaregiverBookingsPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import ProfilePage from './pages/ProfilePage';
import BookingsPage from './pages/BookingsPage';
import MyCareRequestsPage from './pages/MyCareRequestsPage';
import CaregiverMarketplacePage from './pages/CaregiverMarketplacePage';
import PostCareRequestPage from './pages/PostCareRequestPage';

// Scroll to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#0f172a',
              color: '#fff',
              fontSize: '14px',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/become-caregiver" element={<BecomeCaregiverPage />} />
          <Route path="/caregiver/bookings" element={<CaregiverBookingsPage />} />
          <Route path="/caregiver/marketplace" element={<CaregiverMarketplacePage />} />
          <Route path="/care-requests" element={<CaregiverMarketplacePage />} />
          <Route path="/my-care-requests" element={<MyCareRequestsPage />} />
          <Route path="/post-care-request" element={<PostCareRequestPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/caregivers" element={<CaregiversPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
