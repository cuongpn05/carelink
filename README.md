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

## 📅 API ĐẶT LỊCH

Các API dưới đây yêu cầu đăng nhập và gửi access token qua header:

```http
Authorization: Bearer <accessToken>
```

Các endpoint hỗ trợ cả tiền tố `/api` và `/api/v1`.

### Tạo lịch đặt

`POST /api/bookings` hoặc `POST /api/v1/bookings` (chỉ dành cho tài khoản khách hàng đã xác thực email)

```json
{
  "caregiverId": "ID hồ sơ hoặc tài khoản người chăm sóc",
  "packageType": "HOURLY",
  "durationValue": 4,
  "startTime": "2027-01-01T08:00:00.000Z",
  "serviceArea": "Ninh Kiều",
  "serviceAddress": "12 Đường ABC, Ninh Kiều",
  "requiredSkills": ["Chăm sóc người cao tuổi"],
  "note": "Vui lòng gọi trước khi đến",
  "paymentMethod": "CASH"
}
```

Gói `HOURLY` nhận `durationValue` là 2, 4, 6, 8, 10 hoặc 12 giờ. Gói
`DAILY`, `WEEKLY`, `MONTHLY` nhận số nguyên dương. Server lấy giá từ hồ sơ
người chăm sóc, tự tính `endTime` và `totalPrice`; không gửi giá hoặc giờ kết
thúc từ client. Tháng được tính là 30 ngày.

Lịch mới luôn được tạo với trạng thái `PENDING`. Chỉ caregiver được gắn với
lịch mới có thể xác nhận hoặc từ chối yêu cầu đó.

### Lấy lịch của tôi

- `GET /api/bookings/mine` — lịch mà tài khoản hiện tại đặt hoặc nhận.
- `GET /api/bookings/customer` — danh sách lịch của khách hàng đang đăng nhập.
- `GET /api/bookings/notifications` — thông báo caregiver đã xác nhận lịch.
- `PATCH /api/bookings/notifications/:id/read` — đánh dấu thông báo đã đọc.
- `GET /api/bookings/:id` — chi tiết một lịch mà tài khoản hiện tại tham gia.

Khách hàng mở mục **Lịch và thông báo của tôi** hoặc truy cập `/bookings` để
xem lịch, trạng thái và thông báo xác nhận. Khi ứng dụng đang mở, chuông thông
báo sẽ tự kiểm tra cập nhật định kỳ; thông báo đã xác nhận vẫn được lưu để xem
lại sau khi đăng nhập.

### Khu vực người chăm sóc

Người chăm sóc đã được duyệt mở **Khu vực Đối tác** trên thanh điều hướng để vào
`/caregiver/bookings`. Trang này gọi:

- `GET /api/bookings/incoming` — lấy lịch khách đặt cho người chăm sóc đang đăng nhập.
- `PATCH /api/bookings/:id/confirm` — chuyển lịch thuộc caregiver từ `PENDING`
  sang `CONFIRMED`.
- `PATCH /api/bookings/:id/reject` — caregiver từ chối lịch `PENDING`, chuyển sang
  `CANCELLED` và tạo thông báo cho khách hàng.

API chỉ cho phép chủ lịch là người chăm sóc đã được duyệt xác nhận hoặc từ chối;
các lịch đã xử lý hoặc thuộc tài khoản khác không thể cập nhật. API danh sách
trả về tất cả trạng thái booking gắn với caregiver, bao gồm cả các booking cũ
lưu caregiver bằng profile ID. Nhiều yêu cầu `PENDING`
có thể cùng khung giờ để caregiver lựa chọn. Tuy nhiên, không thể tạo lịch trùng
với lịch đã `CONFIRMED`/`IN_PROGRESS`; nếu một yêu cầu trùng giờ khác đã được
xác nhận trước, yêu cầu còn lại sẽ không xác nhận được. Trang lịch của caregiver
tự tải danh sách mới mỗi 15 giây và báo khi có lịch mới; có thể bấm **Tải lại**
để cập nhật ngay.

Để debug phía client, mở DevTools của trình duyệt:

- Tab **Network** → lọc `incoming` để xem request, HTTP status và JSON response.
- Tab **Console** → lọc `[booking API]` để xem URL, phương thức, status hoặc lỗi.
- Trong Console của trang caregiver, lọc `[caregiver bookings]` để xem tổng số
  lịch API trả về và số lượng theo trạng thái.
- Khi `NODE_ENV=development`, response của `GET /api/bookings/incoming` có thêm
  `debug` gồm database/collection đang truy vấn, các caregiver ID được tìm và
  caregiver ID của booking tìm thấy. So sánh `debug.searchedCaregiverIds` với
  `caregiverId` của booking trong database để phát hiện lệch database hoặc ID.
- Trang caregiver hiển thị endpoint và thời gian tải thành công gần nhất ngay
  dưới số lượng lịch.

API incoming tìm booking theo account ID, caregiver profile ID và user ID từ
tất cả hồ sơ caregiver đã duyệt gắn với tài khoản hiện tại. API không lọc theo
trạng thái, nên trang hiển thị lịch chờ, đã xác nhận, đã từ chối và lịch cũ.

Mọi phản hồi đều có dạng `{ "success": true, "message": "...", "data": ... }`.

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