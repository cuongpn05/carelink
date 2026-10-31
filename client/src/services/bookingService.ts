import axios from 'axios';
import axiosClient from '../api/axiosClient';

export type BookingPackage = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface CreateBookingInput {
  caregiverId: string;
  packageType: BookingPackage;
  durationValue: number;
  startTime: string;
  serviceArea: string;
  serviceAddress: string;
  requiredSkills?: string[];
  note?: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
}

export interface CaregiverBookingInfo {
  accountId: string;
  fullName: string;
  avatarUrl: string;
  phone: string;
  isPhoneRevealed: boolean;
  ratingAvg: number;
  totalReviews: number;
  experienceYears: number;
  serviceAreas: string[];
  reputationScore: number;
}

export interface CustomerBookingInfo {
  accountId: string;
  fullName: string;
  avatarUrl: string;
  phone: string;
  isPhoneRevealed: boolean;
  email: string;
  reputationScore: number;
  status: string;
  isLowReputation: boolean;
}

export interface CancellationInfo {
  cancelledBy: string;
  cancelledByRole: 'CUSTOMER' | 'CAREGIVER' | null;
  reason: string;
  cancelledAt: string;
  penaltyPointsDeducted: number;
}

export interface Booking {
  _id: string;
  customerId: string;
  caregiverId: string;
  bookingType: 'DIRECT' | 'OPEN_POST';
  startTime: string;
  endTime: string;
  packageType: BookingPackage;
  durationValue: number;
  totalPrice: number;
  status: BookingStatus;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  serviceArea: string;
  serviceAddress: string;
  note?: string;
  requiredSkills?: string[];
  isReviewed?: boolean;
  cancellationInfo?: CancellationInfo;
  caregiver?: CaregiverBookingInfo;
  customer?: CustomerBookingInfo;
  createdAt: string;
  updatedAt: string;
}

export interface CancelBookingResponse {
  success: boolean;
  message: string;
  data: {
    booking: Booking;
    penaltyDeducted: number;
    currentReputationScore: number;
    ruleExplanation: string;
  };
}

export const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
  try {
    const res: any = await axiosClient.post('/bookings', input);
    const data = res?.data || res;
    return data;
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      throw new Error(error.response?.data?.message || error.message);
    }
    throw error instanceof Error ? error : new Error('Không thể tạo lịch đặt.');
  }
};

export const getMyBookings = async (): Promise<Booking[]> => {
  try {
    const res: any = await axiosClient.get('/bookings/mine');
    const bookings = res?.data || res;
    return Array.isArray(bookings) ? bookings : [];
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      throw new Error(error.response?.data?.message || error.message);
    }
    throw error instanceof Error ? error : new Error('Không thể tải danh sách lịch đặt.');
  }
};

export const getBookingById = async (id: string): Promise<Booking> => {
  try {
    const res: any = await axiosClient.get(`/bookings/${id}`);
    const booking = res?.data || res;
    return booking;
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      throw new Error(error.response?.data?.message || error.message);
    }
    throw error instanceof Error ? error : new Error('Không thể tải thông tin lịch đặt.');
  }
};

export const cancelBooking = async (id: string, reason: string): Promise<CancelBookingResponse> => {
  try {
    const res: any = await axiosClient.patch(`/bookings/${id}/cancel`, { reason });
    return res;
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      throw new Error(error.response?.data?.message || error.message);
    }
    throw error instanceof Error ? error : new Error('Không thể hủy lịch đặt.');
  }
};

export const updateBookingStatus = async (
  id: string,
  status: BookingStatus,
  reason?: string
): Promise<Booking> => {
  try {
    const res: any = await axiosClient.patch(`/bookings/${id}/status`, { status, reason });
    const booking = res?.data || res;
    return booking;
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      throw new Error(error.response?.data?.message || error.message);
    }
    throw error instanceof Error ? error : new Error('Không thể cập nhật trạng thái lịch đặt.');
  }
};
