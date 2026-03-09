# Market-Source
![QTusdev](https://files.catbox.moe/pvjcxr.png)
![QTusdev](https://files.catbox.moe/4qm2s6.png)
![QTusdev](https://files.catbox.moe/9a0qx5.png)
Website chuyên về code - Nền tảng mua bán mã nguồn chất lượng cao

## 🚀 Tính năng chính

- **Giao diện hiện đại**: Thiết kế responsive với Dark/Light mode
- **Hệ thống người dùng**: Đăng ký, đăng nhập, quản lý tài khoản
- **Giỏ hàng thông minh**: Thêm, xóa, cập nhật số lượng sản phẩm
- **Thanh toán đa dạng**: MB Bank, Momo, Techcombank, TPBank
- **Admin Dashboard**: Quản lý người dùng, sản phẩm, giao dịch
- **Thông báo realtime**: Telegram & WhatsApp notifications
- **Nạp/Rút tiền**: Hệ thống tài chính hoàn chỉnh

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Firebase Realtime Database
- **Notifications**: Telegram Bot API, WhatsApp Web API
- **Deployment**: Vercel

## 📦 Cài đặt

### 1. Clone repository

\`\`\`bash
git clone https://github.com/qtu11/Market-Source-code.git
cd Market-Source-code
\`\`\`

### 2. Cài đặt dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Cấu hình environment variables

Tạo file `.env.local` từ `.env.example`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Cập nhật các giá trị trong `.env.local`:

\`\`\`env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

### 4. Chạy development server

\`\`\`bash
npm run dev
\`\`\`

Truy cập [http://localhost:3000](http://localhost:3000) để xem website.


2. Build & chạy toàn bộ stack (Next.js + Supabase Postgres):
   ```bash
   docker compose up --build
   ```
3. Container `web` tự `npx prisma migrate deploy` trước khi khởi động `next start`.
4. Dừng dịch vụ:
   ```bash
   docker compose down
   ```
   Thêm `-v` nếu muốn xóa dữ liệu database.

> Port 3000 (Next.js) và 5432 (Supabase Postgres) được bind ra host nên bạn có thể kết nối bằng các PostgreSQL client để debug dữ liệu.

### Phiên bản Node bắt buộc

- Node.js >= 20.14.0
- npm >= 10.8

Khuyến nghị dùng Volta hoặc nvm use 20.14.0 để đồng bộ môi trường.

## 🔧 Cấu hình Firebase

### 1. Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới
3. Chọn "Add Firebase to your web app"
4. Copy config và paste vào `.env.local`

### 2. Cấu hình Realtime Database

1. Vào Database → Realtime Database
2. Tạo database với rules:

\`\`\`json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
\`\`\`

## 🤖 Cấu hình Telegram Bot

### 1. Tạo Bot

1. Chat với [@BotFather](https://t.me/BotFather)
2. Gửi `/newbot` và làm theo hướng dẫn
3. Lưu Bot Token

### 2. Lấy Chat ID

1. Thêm bot vào group hoặc chat riêng
2. Gửi tin nhắn bất kỳ
3. Truy cập: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
4. Tìm `chat.id` trong response

### 3. Cấu hình Webhook (Production)

\`\`\`bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/telegram-webhook"}'
\`\`\`

## 🚀 Deploy

### Deploy lên Netlify

1. **Push code lên GitHub** (đã hoàn thành)
2. **Truy cập [Netlify Dashboard](https://app.netlify.com/)**
3. **Import từ GitHub:**
   - Click "Add new site" → "Import an existing project"
   - Chọn repository `qtu11/Market-Source-code`
   - Branch: `main`
4. **Cấu hình Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
5. **Thêm Environment Variables:**
   - Thêm tất cả biến từ `.env.local` vào Netlify
   - Đặc biệt: `DATABASE_URL`, `NEXT_PUBLIC_FIREBASE_*`, `TELEGRAM_BOT_TOKEN`, etc.
6. **Deploy**

### Deploy lên Vercel (Alternative)

1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard)
2. Import GitHub repository `qtu11/Market-Source-code`
3. Cấu hình Environment Variables
4. Deploy

## 👨‍💼 Sử dụng Admin Dashboard

### Đăng nhập Admin

- **URL**: `/admin/login`
- **Email**: `admin@gmail.com`
- **Password**: `qtusdev`

### Tính năng Admin

1. **Dashboard**: Thống kê tổng quan
2. **Users**: Quản lý người dùng và số dư
3. **Products**: Thêm/sửa/xóa sản phẩm
4. **Deposits**: Duyệt yêu cầu nạp tiền
5. **Withdraws**: Duyệt yêu cầu rút tiền
6. **WhatsApp**: Xem thông báo WhatsApp
7. **Settings**: Cài đặt hệ thống

## 💳 Phương thức thanh toán

### Nạp tiền (Minimum: 5,000đ)

- **MB Bank**: 0328551707 - NGUYEN QUANG TU
- **Momo**: 0328551707 - NGUYEN QUANG TU  
- **Techcombank**: 2002200710 - NGUYEN QUANG TU
- **TPBank**: 00005372546 - NGUYEN QUANG TU

### Rút tiền

Hỗ trợ tất cả ngân hàng Việt Nam:
- Vietcombank, Techcombank, BIDV, Agribank
- MB Bank, ACB, TPBank, VPBank
- Sacombank, HDBank, SHB, Eximbank
- Và 20+ ngân hàng khác

## 📱 Thông báo

### Telegram

- Thông báo realtime khi có giao dịch
- Nút duyệt nhanh trong Telegram
- Theo dõi hoạt động người dùng

### WhatsApp

- Thông báo qua WhatsApp Web
- Link trực tiếp đến admin panel
- Backup cho Telegram notifications

## 🔍 API Endpoints

### Public APIs

- `GET /api/products` - Lấy danh sách sản phẩm
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký

### Admin APIs

- `POST /api/admin/approve-deposit` - Duyệt nạp tiền
- `POST /api/admin/approve-withdraw` - Duyệt rút tiền
- `GET /api/admin/stats` - Thống kê admin

### Webhook APIs

- `POST /api/telegram-webhook` - Telegram webhook
- `POST /api/whatsapp-webhook` - WhatsApp webhook

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **Firebase connection failed**
   - Kiểm tra config trong `.env.local`
   - Đảm bảo Firebase project đã được tạo

2. **Telegram notifications không hoạt động**
   - Kiểm tra Bot Token và Chat ID
   - Đảm bảo bot đã được thêm vào group

3. **Build failed**
   - Chạy `npm run build` để kiểm tra lỗi
   - Kiểm tra TypeScript errors

4. **Admin login không được**
   - Email: `admin@gmail.com`
   - Password: `qtusdev` (chính xác)

### Performance

- Sử dụng Next.js Image Optimization
- Lazy loading cho components
- Caching với localStorage
- Optimized bundle size

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- **Developer**: qtusdev
- **Email**: admin@gmail.com
- **GitHub**: [qtu11/Market-Source-code](https://github.com/qtu11/Market-Source-code)
- **Website**: (Sẽ cập nhật sau khi deploy)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Firebase](https://firebase.google.com/)
- [Vercel](https://vercel.com/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
# Market-Source
#   M a r k e t S o u r c e  
 