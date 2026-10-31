import axios from 'axios';
import axiosClient from '../api/axiosClient';

export type BookingPackage = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

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

export interface Booking {
  _id: string;
  startTime: string;
  endTime: string;
  packageType: BookingPackage;
  durationValue: number;
  totalPrice: number;
  status: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  serviceAddress: string;
}

const isBooking = (value: unknown): value is Booking => {
  if (!value || typeof value !== 'object') return false;

  const booking = value as Record<string, unknown>;
  return (
    typeof booking._id === 'string' &&
    typeof booking.startTime === 'string' &&
    typeof booking.endTime === 'string' &&
    ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'].includes(String(booking.packageType)) &&
    typeof booking.durationValue === 'number' &&
    typeof booking.totalPrice === 'number' &&
    typeof booking.status === 'string' &&
    ['CASH', 'BANK_TRANSFER'].includes(String(booking.paymentMethod)) &&
    typeof booking.serviceAddress === 'string'
  );
};

export const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
  try {
    const response = await axiosClient.post('/bookings', input);
    const booking: unknown = response.data;

    if (!isBooking(booking)) {
      throw new Error('API không trả về thông tin lịch đặt hợp lệ.');
    }

    return booking;
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      throw new Error(error.response?.data?.message || error.message);
    }

    throw error instanceof Error ? error : new Error('Không thể tạo lịch đặt.');
  }
};
