import {
  CareRequestItem,
  CreateCareRequestDto,
  CareRequestStats,
  CareRequestNotification,
  CareServiceCategory,
  CareFrequency,
} from '../types/careRequest';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  currentStatus?: string;
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
}

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(
  /\/+$/,
  ''
);

const requestCareRequestApi = async <T>(
  path: string,
  options: ApiRequestOptions = {}
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

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store',
    });
  } catch (error) {
    console.error(`[careRequest API] ${method} ${url} network error`, error);
    throw new Error(
      `Không thể kết nối đến máy chủ CareLink. Vui lòng kiểm tra kết nối mạng của bạn.`
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const typedPayload = (payload || {}) as Partial<ApiResponse<T>>;

  if (!response.ok || typedPayload.success === false) {
    const errorMsg =
      typedPayload.message ||
      `Yêu cầu thất bại (${response.status}: ${response.statusText})`;
    const error: Error & { status?: number; currentStatus?: string } = new Error(
      errorMsg
    );
    error.status = response.status;
    error.currentStatus = typedPayload.currentStatus;
    throw error;
  }

  return typedPayload as ApiResponse<T>;
};

export interface OpenCareRequestFilters {
  serviceCategory?: CareServiceCategory | 'ALL';
  area?: string;
  frequency?: CareFrequency | 'ALL';
  budgetMin?: number;
  budgetMax?: number;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface OpenCareRequestsResponse {
  requests: CareRequestItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MyCareRequestsResponse {
  requests: CareRequestItem[];
  stats: CareRequestStats;
}

/**
 * 1. Customer: Đăng yêu cầu chăm sóc mới
 */
export const createCareRequest = async (
  input: CreateCareRequestDto
): Promise<CareRequestItem> => {
  const res = await requestCareRequestApi<CareRequestItem>('/care-requests', {
    method: 'POST',
    body: input,
  });
  return res.data;
};

/**
 * 2. Customer: Lấy danh sách yêu cầu do chính mình đăng
 */
export const getMyCareRequests = async (
  status?: string
): Promise<MyCareRequestsResponse> => {
  const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
  const res = await requestCareRequestApi<MyCareRequestsResponse>(
    `/care-requests/mine${query}`
  );
  return res.data;
};

/**
 * 3. Caregiver Marketplace: Lấy bảng tin yêu cầu đang mở (Status: OPEN)
 */
export const getOpenCareRequests = async (
  filters: OpenCareRequestFilters = {}
): Promise<OpenCareRequestsResponse> => {
  const params = new URLSearchParams();
  if (filters.serviceCategory && filters.serviceCategory !== 'ALL') {
    params.set('serviceCategory', filters.serviceCategory);
  }
  if (filters.area && filters.area !== 'ALL') {
    params.set('area', filters.area);
  }
  if (filters.frequency && filters.frequency !== 'ALL') {
    params.set('frequency', filters.frequency);
  }
  if (filters.budgetMin) {
    params.set('budgetMin', String(filters.budgetMin));
  }
  if (filters.budgetMax) {
    params.set('budgetMax', String(filters.budgetMax));
  }
  if (filters.keyword) {
    params.set('keyword', filters.keyword);
  }
  if (filters.page) {
    params.set('page', String(filters.page));
  }
  if (filters.limit) {
    params.set('limit', String(filters.limit));
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await requestCareRequestApi<OpenCareRequestsResponse>(
    `/care-requests/open${query}`
  );
  return res.data;
};

/**
 * 4. Chi tiết một yêu cầu chăm sóc theo ID
 */
export const getCareRequestById = async (
  id: string
): Promise<CareRequestItem> => {
  const res = await requestCareRequestApi<CareRequestItem>(
    `/care-requests/${encodeURIComponent(id)}`
  );
  return res.data;
};

/**
 * 5. Caregiver: Tiếp nhận yêu cầu chăm sóc (Atomic conditional update)
 */
export const acceptCareRequest = async (
  id: string
): Promise<CareRequestItem> => {
  const res = await requestCareRequestApi<CareRequestItem>(
    `/care-requests/${encodeURIComponent(id)}/accept`,
    {
      method: 'PATCH',
    }
  );
  return res.data;
};

/**
 * 6. Customer: Hủy yêu cầu (khi chưa được tiếp nhận)
 */
export const cancelCareRequest = async (
  id: string,
  reason?: string
): Promise<CareRequestItem> => {
  const res = await requestCareRequestApi<CareRequestItem>(
    `/care-requests/${encodeURIComponent(id)}/cancel`,
    {
      method: 'PATCH',
      body: { reason },
    }
  );
  return res.data;
};

/**
 * 7. Cập nhật tiến độ: IN_PROGRESS | COMPLETED
 */
export const updateCareRequestStatus = async (
  id: string,
  newStatus: 'IN_PROGRESS' | 'COMPLETED'
): Promise<CareRequestItem> => {
  const res = await requestCareRequestApi<CareRequestItem>(
    `/care-requests/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: { newStatus },
    }
  );
  return res.data;
};

/**
 * 8. Customer: Lấy thông báo khi có Caregiver nhận việc
 */
export const getCareRequestNotifications = async (): Promise<
  CareRequestNotification[]
> => {
  const res = await requestCareRequestApi<CareRequestNotification[]>(
    '/care-requests/notifications'
  );
  return res.data;
};

/**
 * 9. Đánh dấu đã đọc thông báo
 */
export const markCareRequestNotificationRead = async (
  id: string
): Promise<void> => {
  await requestCareRequestApi<void>(
    `/care-requests/notifications/${encodeURIComponent(id)}/read`,
    {
      method: 'PATCH',
    }
  );
};

