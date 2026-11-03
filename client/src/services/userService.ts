import axiosClient from '../api/axiosClient';

export interface UserAddressLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface UserAddress {
  _id: string;
  label: 'Nhà riêng' | 'Công ty' | 'Khác';
  recipientName: string;
  phone: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  detail: string;
  fullAddress: string;
  location?: UserAddressLocation;
  isDefault: boolean;
  isLegacyMigrated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProvinceItem {
  code: string;
  name: string;
  shortName: string;
}

export interface WardItem {
  code: string;
  name: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone: string;
  avatarUrl?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string | null;
}

export interface AddressPayload {
  label?: 'Nhà riêng' | 'Công ty' | 'Khác';
  recipientName: string;
  phone: string;
  provinceCode?: string;
  provinceName: string;
  wardCode?: string;
  wardName: string;
  detail: string;
  location?: {
    coordinates: [number, number];
  };
  isDefault?: boolean;
}

// 1. Lấy thông tin cá nhân đầy đủ
export const getUserProfile = async () => {
  const res: any = await axiosClient.get('/user/profile');
  return res.data;
};

// 2. Cập nhật thông tin cá nhân
export const updateUserProfile = async (payload: UpdateProfilePayload) => {
  const res: any = await axiosClient.put('/user/profile', payload);
  return res.data;
};

// 3. Lấy danh sách sổ địa chỉ
export const getUserAddresses = async (): Promise<UserAddress[]> => {
  const res: any = await axiosClient.get('/user/addresses');
  return res.data?.addresses || [];
};

// 4. Thêm địa chỉ mới
export const addUserAddress = async (payload: AddressPayload) => {
  const res: any = await axiosClient.post('/user/addresses', payload);
  return res.data;
};

// 5. Cập nhật địa chỉ
export const updateUserAddress = async (addressId: string, payload: Partial<AddressPayload>) => {
  const res: any = await axiosClient.put(`/user/addresses/${addressId}`, payload);
  return res.data;
};

// 6. Xóa địa chỉ
export const deleteUserAddress = async (addressId: string) => {
  const res: any = await axiosClient.delete(`/user/addresses/${addressId}`);
  return res.data;
};

// 7. Đặt địa chỉ làm mặc định
export const setDefaultUserAddress = async (addressId: string) => {
  const res: any = await axiosClient.patch(`/user/addresses/${addressId}/default`);
  return res.data;
};

// 8. Lấy danh mục tỉnh/thành sau sáp nhập qua API backend
export const getAdministrativeProvinces = async (): Promise<ProvinceItem[]> => {
  const res: any = await axiosClient.get('/user/administrative/provinces');
  return res.data?.provinces || [];
};

// 9. Lấy danh mục Phường/Xã theo tỉnh thành
export const getAdministrativeWards = async (provinceCode: string): Promise<WardItem[]> => {
  const res: any = await axiosClient.get(`/user/administrative/wards?provinceCode=${encodeURIComponent(provinceCode)}`);
  return res.data?.wards || [];
};
