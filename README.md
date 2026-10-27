# 🌐 CARELINK - CLIENT / SERVER PLATFORM
> **Nền tảng Kết nối & Đặt lịch Chăm sóc Sức khỏe Cộng đồng**  
> **Kiến trúc Công nghệ**: Frontend (**React 18 + TypeScript**) | Backend (**Node.js + Express.js + JavaScript**) | Database (**MongoDB + Mongoose**)

---

## 🎯 TÍNH NĂNG HỆ THỐNG (MVP SCOPE)

| Chức năng | Trạng thái MVP | Mục đích & Mô tả |
| :--- | :---: | :--- |
| **Trang chủ và danh sách dịch vụ** | ✅ Có | Giới thiệu nền tảng, hiển thị danh mục các dịch vụ chăm sóc sức khỏe. |
| **Đăng ký, đăng nhập, đăng xuất** | ✅ Có | Xác thực người dùng bằng JWT, mã hóa mật khẩu an toàn với Bcrypt. |
| **Xem và cập nhật hồ sơ cá nhân** | ✅ Có | Quản lý thông tin tài khoản, số điện thoại, địa chỉ, ảnh đại diện. |
| **Tìm kiếm, lọc người chăm sóc** | ✅ Có | Tìm kiếm theo tên, dịch vụ, lọc theo khu vực hoạt động, mức giá, kinh nghiệm. |
| **Xem chi tiết người chăm sóc** | ✅ Có | Xem kỹ năng, kinh nghiệm, biểu phí, khu vực và đánh giá của khách hàng. |
| **Đặt lịch chăm sóc** | ✅ Có | Chọn ngày, giờ bắt đầu/kết thúc, địa điểm, dịch vụ cần thực hiện và tự động tính tổng phí. |
| **Xem lịch sử và trạng thái đặt lịch**| ✅ Có | Theo dõi lịch đặt: `pending` (chờ duyệt), `confirmed` (đã nhận), `completed` (hoàn thành), `cancelled` (đã hủy). |
| **Hủy lịch theo quy tắc** | ✅ Có | Kiểm tra điều kiện thời gian trước khi cho phép hủy (ví dụ: chỉ được hủy trước 12h/24h). |
| **Đánh giá sau dịch vụ** | ✅ Có | Chấm điểm (1-5 sao) và để lại nhận xét sau khi lịch chăm sóc chuyển sang `completed`. |

---


## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### 1. Cài đặt toàn bộ dependencies
Tại thư mục gốc của dự án, chạy:
```bash
npm run install:all
```
*(Lệnh này sẽ tự động cài đặt dependencies cho cả thư mục gốc, `client/` và `server/`)*

### 2. Cấu hình biến môi trường

* **Server (`server/.env`):**
  ```env
  PORT=5000
  NODE_ENV=development
  MONGODB_URI=mongodb://localhost:27017/carelink
  JWT_SECRET=your_jwt_secret_key_here
  JWT_EXPIRE=30d
  ```

* **Client (`client/.env`):**
  ```env
  REACT_APP_API_URL=http://localhost:5000/api/v1
  PORT=3000
  ```

### 3. Khởi chạy phát triển (Development)

* **Chạy đồng thời cả Frontend và Backend (1 lệnh duy nhất):**
  ```bash
  npm run dev
  ```
  - Backend API: `http://localhost:5000`
  - Frontend Client: `http://localhost:3000`

* **Hoặc chạy riêng lẻ từng phần:**
  ```bash
  # Chỉ chạy Frontend:
  npm run dev:client

  # Chỉ chạy Backend:
  npm run dev:server
  ```