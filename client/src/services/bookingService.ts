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
  serviceArea?: string;
  note?: string;
  confirmedAt?: string | null;
  customerNotificationReadAt?: string | null;
  cancellationInfo?: {
    cancelledByRole?: 'CUSTOMER' | 'CAREGIVER' | null;
    reason?: string;
  };
  customer?: {
    _id: string;
    email?: string;
    fullName: string;
    phone?: string;
  } | null;
}

export interface BookingNotification {
  bookingId: string;
  message: string;
  startTime: string;
  status: string;
  createdAt: string;
  isRead: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  debug?: Record<string, unknown>;
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
}

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api')
  .replace(/\/+$/, '');
const isDevelopment = process.env.NODE_ENV === 'development';

const requestBookingApi = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> => {
  const method = options.method || 'GET';
  const url = `${API_BASE_URL}${path}`;
  const token = localStorage.getItem('carelink_access_token');
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (isDevelopment) {
    console.info(`[booking API] ${method} ${url}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store',
    });
  } catch (error) {
    console.error(`[booking API] ${method} ${url} network error`, error);
    throw new Error(`Không thể kết nối API ${method} ${path}. Kiểm tra server và REACT_APP_API_URL.`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    console.error(`[booking API] ${method} ${url} returned invalid JSON`, error);
    throw new Error(`API ${method} ${path} trả về dữ liệu không hợp lệ (HTTP ${response.status}).`);
  }

  const apiResponse =
    payload && typeof payload === 'object'
      ? payload as Partial<ApiResponse<T>> & { isExpired?: boolean }
      : null;

  if (response.status === 401 && apiResponse?.isExpired) {
    localStorage.removeItem('carelink_access_token');
    localStorage.removeItem('carelink_refresh_token');
    localStorage.removeItem('carelink_account');
    localStorage.removeItem('carelink_user');
    localStorage.removeItem('carelink_caregiver_profile');
  }

  if (!response.ok || !apiResponse || apiResponse.success !== true || !('data' in apiResponse)) {
    const message = apiResponse?.message || response.statusText || 'Lỗi API không xác định.';
    console.error(`[booking API] ${method} ${url} failed: HTTP ${response.status} - ${message}`);
    throw new Error(`API ${method} ${path} lỗi HTTP ${response.status}: ${message}`);
  }

  if (isDevelopment) {
    console.info(`[booking API] ${method} ${url} succeeded: HTTP ${response.status}`);
  }

  return apiResponse as ApiResponse<T>;
};

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
  const response = await requestBookingApi<Booking>('/bookings', {
    method: 'POST',
    body: input,
  });
  const booking: unknown = response.data;

  if (!isBooking(booking)) {
    throw new Error('API POST /bookings trả về thông tin lịch đặt không hợp lệ.');
  }
  return booking;
};

export const getIncomingCaregiverBookings = async (): Promise<Booking[]> => {
  const response = await requestBookingApi<Booking[]>('/bookings/incoming');
  if (!Array.isArray(response.data) || !response.data.every(isBooking)) {
    throw new Error('API GET /bookings/incoming trả về danh sách lịch đặt không hợp lệ.');
  }
  if (process.env.NODE_ENV === 'development') {
    console.info('[caregiver bookings] API diagnostics', {
      count: response.data.length,
      debug: response.debug || 'Server chưa bật diagnostics. Kiểm tra NODE_ENV=development.',
    });
  }
  return response.data;
};

export const confirmCaregiverBooking = async (bookingId: string): Promise<Booking> => {
  const path = `/bookings/${encodeURIComponent(bookingId)}/confirm`;
  const response = await requestBookingApi<Booking>(path, { method: 'PATCH' });
  if (!isBooking(response.data)) {
    throw new Error(`API PATCH ${path} trả về lịch đã xác nhận không hợp lệ.`);
  }
  return response.data;
};

export const rejectCaregiverBooking = async (bookingId: string): Promise<Booking> => {
  const path = `/bookings/${encodeURIComponent(bookingId)}/reject`;
  const response = await requestBookingApi<Booking>(path, { method: 'PATCH' });
  if (!isBooking(response.data)) {
    throw new Error(`API PATCH ${path} trả về lịch đã từ chối không hợp lệ.`);
  }
  return response.data;
};

export const getCustomerBookings = async (): Promise<Booking[]> => {
  const response = await requestBookingApi<Booking[]>('/bookings/customer');
  if (!Array.isArray(response.data) || !response.data.every(isBooking)) {
    throw new Error('API GET /bookings/customer trả về danh sách lịch không hợp lệ.');
  }
  return response.data;
};

export const getBookingNotifications = async (): Promise<BookingNotification[]> => {
  const response = await requestBookingApi<BookingNotification[]>('/bookings/notifications');
  if (!Array.isArray(response.data)) {
    throw new Error('API GET /bookings/notifications trả về danh sách thông báo không hợp lệ.');
  }
  return response.data;
};

export const markBookingNotificationRead = async (bookingId: string): Promise<void> => {
  const path = `/bookings/notifications/${encodeURIComponent(bookingId)}/read`;
  await requestBookingApi<unknown>(path, { method: 'PATCH' });
};
