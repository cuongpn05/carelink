import axios from 'axios';
import { Caregiver } from '../types';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

export type CaregiverSortField =
  | 'createdAt'
  | 'hourlyRate'
  | 'experienceYears'
  | 'ratingAvg'
  | 'reviewCount';

export interface CaregiverFilters {
  keyword?: string;
  minExperience?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  area?: string;
  skill?: string;
  page: number;
  limit: number;
  sortBy: CaregiverSortField;
  order: 'asc' | 'desc';
}

export interface CaregiverPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CaregiverPageResult {
  caregivers: Caregiver[];
  pagination: CaregiverPagination;
}

interface ApiCaregiver {
  _id: string;
  userId?: {
    fullName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  } | null;
  bio?: string;
  experienceYears?: number;
  skills?: string[];
  serviceAreas?: string[];
  hourlyRate?: number;
  ratingAvg?: number;
  reviewCount?: number;
}

interface CaregiverResponse {
  success: boolean;
  message: string;
  data: ApiCaregiver[];
  pagination: CaregiverPagination;
}

interface CaregiverDetailResponse {
  success: boolean;
  message: string;
  data: ApiCaregiver;
}

const fallbackAvatar =
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80';

const toCaregiver = (item: ApiCaregiver): Caregiver => ({
  id: item._id,
  name: item.userId?.fullName || 'Người chăm sóc',
  title: 'Nhân viên chăm sóc',
  experienceYears: item.experienceYears ?? 0,
  rating: item.ratingAvg ?? 0,
  reviewCount: item.reviewCount ?? 0,
  hourlyRate: item.hourlyRate ?? 0,
  avatar: item.userId?.avatar || fallbackAvatar,
  bio: item.bio || 'Hồ sơ chưa có phần giới thiệu.',
  skills: item.skills ?? [],
  certifications: [],
  serviceCategoryIds: [],
  location: item.serviceAreas?.join(', ') || 'Chưa cập nhật khu vực',
  isAvailable: false,
  phone: item.userId?.phone,
});

export const getCaregivers = async (
  filters: CaregiverFilters,
): Promise<CaregiverPageResult> => {
  const response = await api.get<CaregiverResponse>('/caregivers', {
    params: filters,
  });

  return {
    caregivers: (response.data.data ?? []).map(toCaregiver),
    pagination: response.data.pagination,
  };
};

export const getCaregiverById = async (id: string): Promise<Caregiver> => {
  const endpoint = `/caregivers/${encodeURIComponent(id)}`;

  try {
    const response = await api.get<CaregiverDetailResponse>(endpoint);
    return toCaregiver(response.data.data);
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      throw new Error(`GET ${endpoint}${status ? ` (${status})` : ''}: ${message}`);
    }

    throw error instanceof Error ? error : new Error('Lỗi không xác định khi tải caregiver.');
  }
};
