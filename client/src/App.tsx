import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
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
          <Route path="/bookings" element={<MyBookingsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/caregivers" element={<CaregiversPage />} />
          <Route path="/about" element={<AboutPage />} />
          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
