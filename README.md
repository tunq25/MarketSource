# 🛒 MarketSource - Nền tảng Thương Mại Điện Tử Chuyên Nghiệp

![Mô phỏng Giao Diện](public/og-image.png)

MarketSource là nền tảng thương mại điện tử hiện đại, được xây dựng với kiến trúc hướng dịch vụ (Service-Oriented Architecture) mạnh mẽ trên nền tảng **Next.js 14**. Hệ thống cung cấp giải pháp toàn diện từ quản lý người dùng, giao dịch giao nhận tiền tự động, tích hợp xác thực bảo mật đa lớp (MFA/2FA), cho đến bảng điểu khiển quản trị viên siêu việt.

---

## ✨ Tính Năng Nổi Bật

### 🏢 Dành cho Quản Trị Viên (Admin Dashboard)
- **Bảng Điều Khiển Tổng Quan:** Thống kê doanh thu, lưu lượng và các số liệu cốt lõi qua biểu đồ trực quan từ Recharts.
- **Quản Lý Giao Dịch Nạp/Rút Tự Động:** Duyệt/Tự động hóa phê duyệt giao dịch nạp và rút tiền.
- **Hệ Thống Phê Duyệt An Toàn:** Cơ chế ngăn chặn double-submit (Cache Stampede) để đảm bảo không bị cộng tiền 2 lần.
- **Giao Tiếp Khách Hàng:** Tích hợp tính năng Chat trực tuyến để hỗ trợ khách hàng ngay tại giao diện Admin.
- **Kiểm Soát Nhận Diện (CMS):** Giao diện linh hoạt cho phép tùy biến màu sắc, danh mục sản phẩm, banner, v.v.

### 👤 Dành cho Người Dùng (User Experience)
- **Hệ Thống Tài Khoản Đa Chiều:** Hỗ trợ đăng nhập Email/Password với JWT Authentication và OAuth (nếu kích hoạt).
- **Ví Điện Tử (E-Wallet):** Giám sát chi tiết lịch sử tài sản, dòng tiền vào/ra minh bạch, nạp và rút tiền nhanh chóng.
- **Xác Thực Đa Lớp (2FA):** Tăng cường an toàn bằng OTP Google Authenticator, thiết lập bảo mật cấp ngân hàng.
- **Cửa Hàng Khám Phá:** Tìm kiếm, lọc và sắp xếp sản phẩm/phần mềm/dịch vụ tối ưu, tải xuống không giới hạn.
- **Email Xác Thực Tiên Tiến:** Chống quên mật khẩu bằng cơ chế gửi luồng OTP 6 số ngẫu nhiên có hiệu lực 15 phút.

---

## 🚀 Công Nghệ Sử Dụng

🔹 **Frontend (Giao diện người dùng):**
- [Next.js 14 (App Router)](https://nextjs.org/) - Framework React mạnh mẽ nhất cho vi kiến trúc.
- [React](https://react.dev/) - Thư viện nền tảng UI.
- [Tailwind CSS v3](https://tailwindcss.com/) - Kiến trúc tạo kiểu (Styling) tùy biến nhanh chóng.
- [Lucide React](https://lucide.dev/) - Bộ thư viện icon đa dạng tinh tế.
- [Framer Motion](https://www.framer.com/motion/) - Animation mượt mà với phần cứng hỗ trợ WebGL.

🔹 **Backend (Máy chủ và Cơ sở dữ liệu):**
- [PostgreSQL](https://www.postgresql.org/) - Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ, chuẩn ACID.
- [Node.js](https://nodejs.org/) & API Routes - Xử lý logic nghiệp vụ và xác thực.
- [Nodemailer](https://nodemailer.com/) - Máy chủ lưu chuyển e-mail, phục vụ gửi mã OTP an toàn.

---

## ⚙️ Cài Đặt Khởi Chạy Môi Trường Cục Bộ (Local)

Để chạy dự án MarketSource trên máy tính cá nhân, bạn làm theo các bước sau:

**1. Clone kho lưu trữ:**
```bash
git clone https://github.com/qtu11/MarketSource.git
cd MarketSource
```

**2. Cài đặt các gói phụ thuộc (Dependencies):**
```bash
npm install
```

**3. Cấu hình biến môi trường `.env`:**
Tạo file `.env` ở trong thư mục gốc và cung cấp các thông tin thiết yếu sau:
```env
# Database Credentials
DATABASE_URL="postgresql://username:password@host:port/database"

# Security Secrets
NEXTAUTH_SECRET="A_STRONG_RANDOM_SECRET_STRING"
NEXTAUTH_URL="http://localhost:3000"

# SMTP Settings for OTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="....@gmail.com"
SMTP_PASS="YOUR_16_CHAR_APP_PASSWORD"

# Third-party Integrations (Optional)
NEXT_PUBLIC_TELEGRAM_CHAT_ID="xxxxx"
```

**4. Khởi chạy máy chủ phát triển:**
```bash
npm run dev
```

Truy cập theo địa chỉ [http://localhost:3000](http://localhost:3000) trên trình duyệt của bạn để tận hưởng trải nghiệm.

---

## 🔒 Bảo Mật & Đóng Góp

- Dự án tuân thủ nghiêm ngặt các quy định về chống Spam thông qua việc tối ưu khóa API. Mọi đóng góp, báo cáo lỗi (Issue) hoặc đề xuất tính năng (Pull Request) đều được chào đón!

---
*Phát triển bởi [qtu11]* 💻