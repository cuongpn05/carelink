import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor gắn Access Token vào Header mỗi Request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('carelink_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor xử lý Response và bắt lỗi toàn cục
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp payload data từ server
    return response.data;
  },
  (error) => {
    // Nếu token hết hạn hoặc tài khoản bị cấm
    if (error.response && error.response.status === 401) {
      const isExpired = error.response.data?.isExpired;
      if (isExpired) {
        localStorage.removeItem('carelink_access_token');
        localStorage.removeItem('carelink_refresh_token');
        localStorage.removeItem('carelink_account');
        localStorage.removeItem('carelink_user');
        localStorage.removeItem('carelink_caregiver_profile');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

