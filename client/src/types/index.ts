export interface Caregiver {
  id: string;
  name: string;
  title: string; // e.g. "Nhân viên chăm sóc", "Điều dưỡng viên"
  experienceYears: number;
  rating: number;
  reviewCount: number;
  hourlyRate: number; // e.g. 150000
  pricing?: {
    hourlyRate?: number;
    dailyRate?: number;
    weeklyRate?: number | null;
    monthlyRate?: number | null;
  };
  avatar: string;
  bio: string;
  skills: string[];
  certifications: string[];
  serviceCategoryIds: string[];
  location: string;
  isAvailable: boolean;
  phone?: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  description: string;
  iconType: 'home' | 'elderly' | 'medical' | 'baby';
  themeColor: 'blue' | 'purple' | 'green' | 'orange';
  targetSlug: string;
}

export interface TrustFeature {
  id: string;
  title: string;
  description: string;
  iconType: 'shield' | 'clock' | 'users' | 'headphone';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'caregiver' | 'admin';
  avatar?: string;
  phone?: string;
}
