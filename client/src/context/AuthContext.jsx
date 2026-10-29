import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [account, setAccount] = useState(() => {
    try {
      const saved = localStorage.getItem('carelink_account');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('carelink_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [caregiverProfile, setCaregiverProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('carelink_caregiver_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem('carelink_access_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Lưu toàn bộ dữ liệu xác thực sau khi Đăng nhập / Xác thực OTP thành công
  const saveAuthData = useCallback((data) => {
    if (!data) return;

    const {
      account: newAccount,
      user: newUser,
      caregiverProfile: newCaregiver,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    } = data;

    if (newAccessToken) {
      localStorage.setItem('carelink_access_token', newAccessToken);
      setAccessToken(newAccessToken);
    }

    if (newRefreshToken) {
      localStorage.setItem('carelink_refresh_token', newRefreshToken);
    }

    if (newAccount) {
      localStorage.setItem('carelink_account', JSON.stringify(newAccount));
      setAccount(newAccount);
    }

    if (newUser) {
      localStorage.setItem('carelink_user', JSON.stringify(newUser));
      setUser(newUser);
    }

    if (newCaregiver) {
      localStorage.setItem('carelink_caregiver_profile', JSON.stringify(newCaregiver));
      setCaregiverProfile(newCaregiver);
    } else {
      localStorage.removeItem('carelink_caregiver_profile');
      setCaregiverProfile(null);
    }
  }, []);

  // Đăng xuất: gọi API huỷ refresh token, dọn sạch localStorage
  const logout = useCallback(async (navigate) => {
    try {
      if (accessToken) {
        await axiosClient.post('/auth/logout');
      }
    } catch (err) {
      console.warn('Lỗi khi gọi API logout:', err.message);
    } finally {
      localStorage.removeItem('carelink_access_token');
      localStorage.removeItem('carelink_refresh_token');
      localStorage.removeItem('carelink_account');
      localStorage.removeItem('carelink_user');
      localStorage.removeItem('carelink_caregiver_profile');

      setAccount(null);
      setUser(null);
      setCaregiverProfile(null);
      setAccessToken(null);

      if (navigate) {
        navigate('/auth');
      } else {
        window.location.href = '/auth';
      }
    }
  }, [accessToken]);

  // Cập nhật Caregiver Profile trong context khi vừa đăng ký đối tác
  const updateCaregiverProfile = useCallback((profile) => {
    setCaregiverProfile(profile);
    if (profile) {
      localStorage.setItem('carelink_caregiver_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('carelink_caregiver_profile');
    }
  }, []);

  // Lấy dữ liệu hồ sơ mới nhất từ server
  const refreshAuthProfile = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await axiosClient.get('/auth/me');
      if (res.success && res.data) {
        saveAuthData({
          account: res.data.account,
          user: res.data.user,
          caregiverProfile: res.data.caregiverProfile,
        });
      }
    } catch (error) {
      console.error('Không thể làm mới thông tin tài khoản:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, saveAuthData]);

  // Khi component mount, kiểm tra phiên đăng nhập
  useEffect(() => {
    if (accessToken) {
      refreshAuthProfile();
    } else {
      setLoading(false);
    }
  }, [accessToken, refreshAuthProfile]);

  const value = {
    account,
    user,
    caregiverProfile,
    accessToken,
    isAuthenticated: Boolean(account && accessToken),
    loading,
    saveAuthData,
    logout,
    updateCaregiverProfile,
    refreshAuthProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};

