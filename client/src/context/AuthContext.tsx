import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role?: 'patient' | 'caregiver') => void;
  register: (name: string, email: string, role?: 'patient' | 'caregiver') => void;
  logout: () => void;
  toggleDemoAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: 'u-101',
  name: 'Đặng Mai Phương',
  email: 'phuong.dang@carelink.vn',
  role: 'patient',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  phone: '0988 123 456',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('carelink_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('carelink_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('carelink_user');
    }
  }, [user]);

  const login = (email: string, role: 'patient' | 'caregiver' = 'patient') => {
    const newUser: User = {
      id: 'u-' + Date.now(),
      name: email.split('@')[0] || 'Người dùng CareLink',
      email,
      role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    };
    setUser(newUser);
  };

  const register = (name: string, email: string, role: 'patient' | 'caregiver' = 'patient') => {
    const newUser: User = {
      id: 'u-' + Date.now(),
      name,
      email,
      role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const toggleDemoAuth = () => {
    if (user) {
      logout();
    } else {
      setUser(DEMO_USER);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        toggleDemoAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

