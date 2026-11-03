import axiosClient from '../api/axiosClient';

export interface HospitalLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface HospitalRules {
  visitingHours: string;
  overnightAllowed: boolean;
  caregiverPassRequired: boolean;
  notes?: string;
}

export interface HospitalItem {
  _id: string;
  code: string;
  name: string;
  provinceCode: string;
  provinceName: string;
  wardCode?: string;
  wardName?: string;
  address: string;
  location: HospitalLocation;
  departments: string[];
  rules: HospitalRules;
  isActive: boolean;
}

export const getHospitals = async (
  provinceCode?: string,
  keyword?: string
): Promise<HospitalItem[]> => {
  const params: Record<string, string> = {};
  if (provinceCode) params.provinceCode = provinceCode;
  if (keyword) params.keyword = keyword;

  const res: any = await axiosClient.get('/hospitals', { params });
  return res.data?.data || [];
};

export const getHospitalById = async (id: string): Promise<HospitalItem | null> => {
  const res: any = await axiosClient.get(`/hospitals/${id}`);
  return res.data?.data || null;
};
