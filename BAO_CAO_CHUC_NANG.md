# 📋 BÁO CÁO CHI TIẾT VỀ CÁC CHỨC NĂNG VÀ LOGIC HOẠT ĐỘNG

## 🎯 TỔNG QUAN HỆ THỐNG

Hệ thống được xây dựng với Next.js, TypeScript, MySQL, và các công nghệ hiện đại. Bao gồm 3 phần chính:
1. **Trang Dashboard (Khách hàng)** - `/dashboard/overview`
2. **Trang Admin Control** - `/admin`
3. **Đăng nhập/Đăng ký** - `/auth/login` và `/auth/register`

---

## 📱 TRANG DASHBOARD (KHÁCH HÀNG) - `/dashboard/overview`

### 1. **Hiển thị số dư và thống kê**

#### Chức năng:
- Hiển thị số dư hiện tại từ `currentUser.balance`
- Tổng chi tiêu (từ lịch sử mua hàng)
- Tổng đã nạp (từ lịch sử nạp tiền)
- Tổng đã rút (từ lịch sử rút tiền)
- Tổng số lượt tải xuống

#### Logic hoạt động:
```typescript
// Tính toán stats từ dữ liệu
const getStats = () => {
  const totalSpent = userPurchases.reduce((sum, purchase) => sum + purchase.price, 0)
  const totalDeposited = depositHistory.reduce((sum, deposit) => sum + deposit.amount, 0)
  const totalWithdrawn = withdrawHistory.reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
  const currentBalance = currentUser?.balance || 0
  
  return { totalPurchases, totalSpent, totalDeposited, totalWithdrawn, currentBalance }
}
```

#### Refresh balance:
- **Tự động refresh mỗi 2 phút** (120 giây) thông qua `userManager.getUserData()`
- **Refresh ngay lập tức** khi có event `depositsUpdated`, `withdrawalsUpdated`, hoặc `userUpdated`
- Balance được sync từ MySQL database qua `userManager`

---

### 2. **Chức năng nạp tiền**

#### Công dụng:
- Cho phép khách hàng nạp tiền vào tài khoản
- Hỗ trợ nhiều phương thức: MB Bank, Momo, Techcombank, TPBank
- Hiển thị QR code và thông tin chuyển khoản

#### Logic hoạt động:
1. **Tạo yêu cầu nạp tiền** (`/app/deposit/page.tsx`):
   - User nhập số tiền (tối thiểu 5,000đ)
   - Chọn phương thức thanh toán
   - Nhập mã giao dịch
   - Gọi API `POST /api/deposits` với data:
     ```json
     {
       "userId": "user_id",
       "amount": 100000,
       "method": "MB Bank",
       "transactionId": "ABC123",
       "userEmail": "user@example.com",
       "deviceInfo": {...},
       "ipAddress": "192.168.1.1"
     }
     ```
   - Lưu vào MySQL table `deposits` với status `pending`
   - Tạo notification cho admin

2. **Admin duyệt nạp tiền** (`/app/admin/page.tsx`):
   - Admin xem danh sách pending deposits
   - Click "Duyệt" → Gọi API `POST /api/admin/approve-deposit`
   - API sẽ:
     - Validate deposit (kiểm tra status, amount)
     - Gọi `approveDepositAndUpdateBalanceMySQL()` trong `lib/database-mysql.ts`
     - **Tự động cộng balance** vào tài khoản user:
       ```sql
       UPDATE users SET balance = balance + ? WHERE id = ? FOR UPDATE
       ```
     - Update deposit status thành `approved`
     - Tạo notification cho user
     - Dispatch event `depositsUpdated` và `userUpdated`

3. **User nhận cập nhật**:
   - Dashboard tự động refresh balance khi nhận event `depositsUpdated`
   - Hiển thị số dư mới ngay lập tức
   - Lịch sử nạp tiền được cập nhật

#### Flow hoàn chỉnh:
```
User tạo yêu cầu → Lưu vào DB (pending) → Admin duyệt → 
Cộng balance → Update status → Notification → Refresh UI
```

---

### 3. **Chức năng rút tiền**

#### Công dụng:
- Cho phép khách hàng rút tiền về ngân hàng
- Hỗ trợ 40+ ngân hàng Việt Nam
- Kiểm tra số dư trước khi cho phép rút

#### Logic hoạt động:
1. **Tạo yêu cầu rút tiền** (`/app/withdraw/page.tsx`):
   - User chọn ngân hàng
   - Nhập số tài khoản (8-15 chữ số)
   - Nhập tên chủ tài khoản
   - Nhập số tiền (tối thiểu 10,000đ)
   - **Kiểm tra số dư**: `withdrawAmount <= userBalance`
   - Gọi API `POST /api/withdrawals` với data:
     ```json
     {
       "userId": "user_id",
       "amount": 50000,
       "bankName": "Vietcombank",
       "accountNumber": "1234567890",
       "accountName": "NGUYEN VAN A",
       "userEmail": "user@example.com"
     }
     ```
   - Lưu vào MySQL table `withdrawals` với status `pending`
   - Tạo notification cho admin

2. **Admin duyệt rút tiền** (`/app/admin/page.tsx`):
   - Admin xem danh sách pending withdrawals
   - Click "Duyệt" → Gọi API `POST /api/admin/approve-withdrawal`
   - API sẽ:
     - Validate withdrawal (kiểm tra status, amount, balance)
     - Gọi `approveWithdrawalAndUpdateBalanceMySQL()` trong `lib/database-mysql.ts`
     - **Tự động trừ balance** từ tài khoản user:
       ```sql
       UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ? FOR UPDATE
       ```
     - Update withdrawal status thành `approved`
     - Tạo notification cho user
     - Dispatch event `withdrawalsUpdated` và `userUpdated`

3. **User nhận cập nhật**:
   - Dashboard tự động refresh balance khi nhận event `withdrawalsUpdated`
   - Hiển thị số dư mới ngay lập tức
   - Lịch sử rút tiền được cập nhật

#### Flow hoàn chỉnh:
```
User tạo yêu cầu → Kiểm tra số dư → Lưu vào DB (pending) → 
Admin duyệt → Trừ balance → Update status → Notification → Refresh UI
```

---

### 4. **Chat với admin (Real-time + AI Auto-reply)**

#### Công dụng:
- Chat trực tuyến với admin
- AI tự động trả lời các câu hỏi thường gặp
- Lưu lịch sử chat

#### Logic hoạt động:
1. **Component ChatWidget** (`/components/chat-widget.tsx`):
   - Hiển thị floating button ở góc dưới bên phải
   - Mở cửa sổ chat khi click
   - Polling mỗi 2.5 giây để load tin nhắn mới

2. **Gửi tin nhắn**:
   - User nhập tin nhắn → Gọi API `POST /api/chat`
   - API lưu tin nhắn vào MySQL table `chats`
   - **AI Auto-reply** (`/app/api/chat/route.ts`):
     - Nếu tin nhắn chứa từ khóa hỗ trợ → Gọi Gemini AI
     - AI phân tích và trả lời tự động
     - Lưu câu trả lời của AI vào DB
     - Admin có thể xem và trả lời thêm

3. **Admin xem chat** (`/components/chat-admin.tsx`):
   - Admin xem danh sách tất cả users đã chat
   - Chọn user để xem lịch sử chat
   - Gửi tin nhắn trả lời
   - Polling mỗi 2 giây để load tin nhắn mới

#### Flow hoạt động:
```
User gửi tin nhắn → Lưu vào DB → AI phân tích → 
Trả lời tự động (nếu có) → Admin xem và trả lời → 
User nhận tin nhắn (real-time polling)
```

---

### 5. **Các chức năng khác trong Dashboard**

#### Tab "Sản phẩm đã mua":
- Hiển thị danh sách sản phẩm đã mua
- Tìm kiếm, lọc theo danh mục
- Sắp xếp theo giá, tên, ngày mua
- Đánh dấu yêu thích
- Đánh giá sản phẩm (1-5 sao)
- Tải xuống sản phẩm

#### Tab "Tải xuống":
- Lịch sử tải xuống
- Tải lại link download
- Export lịch sử

#### Tab "Wishlist":
- Danh sách sản phẩm yêu thích
- Chia sẻ wishlist

#### Tab "Đánh giá":
- Xem và quản lý đánh giá sản phẩm
- Tạo, sửa, xóa đánh giá

#### Tab "Lịch sử nạp tiền":
- Hiển thị tất cả giao dịch nạp tiền đã được duyệt
- Filter theo status, thời gian

#### Tab "Lịch sử rút tiền":
- Hiển thị tất cả giao dịch rút tiền đã được xử lý
- Filter theo status, thời gian

#### Tab "Hoạt động":
- Timeline tất cả hoạt động: mua hàng, nạp, rút
- Filter theo loại hoạt động
- Export log

#### Tab "Analytics cá nhân":
- Biểu đồ chi tiêu theo thời gian
- Top 5 sản phẩm đã mua nhiều nhất
- Thống kê chi tiết

#### Tab "Thông báo":
- Notification center
- Đánh dấu đã đọc
- Filter theo loại

#### Tab "Hỗ trợ":
- Gửi ticket hỗ trợ
- Xem lịch sử ticket
- Cập nhật trạng thái ticket

#### Tab "Thông tin cá nhân":
- Cập nhật avatar, tên, số điện thoại, địa chỉ
- Liên kết mạng xã hội
- Lưu vào MySQL table `user_profiles`

#### Tab "Bảo mật":
- Bật/tắt 2FA (Two-Factor Authentication)
- Quản lý thiết bị đăng nhập
- Backup codes

#### Tab "Referral":
- Mã giới thiệu
- Lịch sử người được giới thiệu
- Hoa hồng

#### Tab "Coupons":
- Danh sách mã giảm giá
- Áp dụng coupon

#### Tab "Thiết bị":
- Quản lý thiết bị đăng nhập
- Revoke session
- Đánh dấu thiết bị tin cậy

---

## 🔐 TRANG ADMIN CONTROL - `/admin`

### 1. **Quản lý người dùng**

#### Chức năng:
- Xem danh sách tất cả users
- Tìm kiếm, lọc users
- Cập nhật trạng thái (active, banned, pending)
- Cập nhật số dư thủ công
- Bulk actions (khóa, mở khóa nhiều users)
- Export danh sách users

#### Logic hoạt động:
- Load users từ MySQL qua `getUsersMySQL()`
- Hiển thị: email, tên, số dư, role, status, ngày đăng ký
- Admin có thể:
  - Click "Khóa" → Update status = 'banned'
  - Click "Mở khóa" → Update status = 'active'
  - Click "Cập nhật số dư" → Gọi API `/api/admin/update-balance`
  - Chọn nhiều users → Bulk actions

---

### 2. **Duyệt nạp/rút tiền**

#### Chức năng:
- Xem danh sách pending deposits và withdrawals
- Duyệt hoặc từ chối yêu cầu
- **Tự động cộng/trừ balance** khi duyệt

#### Logic hoạt động:

**Duyệt nạp tiền:**
1. Admin click "Duyệt" trên deposit
2. Gọi `approveDeposit(depositId)`
3. Gọi API `POST /api/admin/approve-deposit` với:
   ```json
   {
     "depositId": 123,
     "action": "approve",
     "amount": 100000,
     "userId": "user_id",
     "userEmail": "user@example.com"
   }
   ```
4. API gọi `approveDepositAndUpdateBalanceMySQL()`:
   - Bắt đầu transaction
   - Lock user row: `SELECT ... FOR UPDATE`
   - Cộng balance: `UPDATE users SET balance = balance + amount WHERE id = ?`
   - Update deposit status: `UPDATE deposits SET status = 'approved' WHERE id = ?`
   - Commit transaction
5. Dispatch event `depositsUpdated` và `userUpdated`
6. Dashboard user tự động refresh balance

**Duyệt rút tiền:**
1. Admin click "Duyệt" trên withdrawal
2. Gọi `approveWithdrawal(withdrawalId)`
3. Gọi API `POST /api/admin/approve-withdrawal` với:
   ```json
   {
     "withdrawalId": 456,
     "action": "approve",
     "amount": 50000,
     "userId": "user_id",
     "userEmail": "user@example.com"
   }
   ```
4. API gọi `approveWithdrawalAndUpdateBalanceMySQL()`:
   - Bắt đầu transaction
   - Lock user row: `SELECT ... FOR UPDATE`
   - Kiểm tra số dư: `balance >= amount`
   - Trừ balance: `UPDATE users SET balance = balance - amount WHERE id = ? AND balance >= ?`
   - Update withdrawal status: `UPDATE withdrawals SET status = 'approved' WHERE id = ?`
   - Commit transaction
5. Dispatch event `withdrawalsUpdated` và `userUpdated`
6. Dashboard user tự động refresh balance

#### Concurrency Control:
- Sử dụng `FOR UPDATE` để lock user row trong transaction
- Đảm bảo không có race condition khi nhiều admin cùng duyệt
- Balance được cập nhật atomic

---

### 3. **Chat với người dùng**

#### Chức năng:
- Xem danh sách tất cả users đã chat
- Chọn user để xem lịch sử chat
- Gửi tin nhắn trả lời
- Real-time polling mỗi 2 giây

#### Logic hoạt động:
- Component `ChatAdmin` (`/components/chat-admin.tsx`)
- Load tất cả chats từ API `GET /api/chat`
- Group messages theo `user_id`
- Hiển thị danh sách users với tin nhắn cuối
- Admin chọn user → Load messages của user đó
- Gửi tin nhắn → Lưu vào DB với `is_admin = true`
- Polling để load tin nhắn mới

---

### 4. **Các chức năng khác trong Admin**

#### Tab "Overview":
- Thống kê tổng quan: doanh thu, users, pending transactions
- Biểu đồ doanh thu theo thời gian
- Top sản phẩm bán chạy

#### Tab "Products":
- Quản lý sản phẩm: thêm, sửa, xóa
- Upload ảnh, file download
- Quản lý giá, danh mục

#### Tab "Analytics":
- Phân tích doanh thu
- Phân tích users
- Phân tích sản phẩm

#### Tab "Customer Support":
- Quản lý tickets hỗ trợ
- Trả lời tickets
- Cập nhật trạng thái

#### Tab "Notifications":
- Gửi thông báo cho users
- Quản lý notifications

#### Tab "Settings":
- Cấu hình hệ thống
- Quản lý roles

#### Tab "Announcements":
- Tạo thông báo công khai
- Hiển thị trên homepage

#### Tab "FAQ":
- Quản lý câu hỏi thường gặp
- Phân loại FAQ

#### Tab "Audit Logs":
- Xem log tất cả thao tác
- Tìm kiếm log

#### Tab "Promotions":
- Tạo mã giảm giá
- Quản lý promotions

#### Tab "Reports":
- Báo cáo tài chính
- Export reports

#### Tab "Backup & Restore":
- Backup database
- Restore từ backup

---

## 🔑 ĐĂNG NHẬP/ĐĂNG KÝ

### 1. **Đăng ký** (`/auth/register`)

#### Chức năng:
- Tạo tài khoản mới
- Hỗ trợ đăng ký bằng email/password
- Hỗ trợ OAuth (Google, Facebook, GitHub)

#### Logic hoạt động:
1. **Đăng ký bằng email/password**:
   - User nhập: tên, email, password, confirm password
   - Validate: password >= 6 ký tự, password === confirmPassword
   - Gọi API `POST /api/register`:
     ```json
     {
       "name": "Nguyen Van A",
       "email": "user@example.com",
       "password": "hashed_password"
     }
     ```
   - API tạo user trong MySQL:
     - Hash password với bcrypt
     - Lưu vào table `users`
     - Set balance = 0, role = 'user'
   - Lưu user vào localStorage qua `userManager`
   - Redirect đến `/dashboard`

2. **Đăng ký bằng OAuth**:
   - User click "Đăng ký với Google/Facebook/GitHub"
   - NextAuth xử lý OAuth flow
   - Callback → Gọi API `/api/auth-callback`
   - API tạo hoặc update user trong MySQL
   - Lưu vào localStorage
   - Redirect đến `/dashboard`

---

### 2. **Đăng nhập** (`/auth/login`)

#### Chức năng:
- Đăng nhập bằng email/password
- Hỗ trợ OAuth (Google, Facebook, GitHub)
- Ghi nhớ đăng nhập
- Quên mật khẩu

#### Logic hoạt động:
1. **Đăng nhập bằng email/password**:
   - User nhập email và password
   - Gọi API `POST /api/login`:
     ```json
     {
       "email": "user@example.com",
       "password": "password",
       "deviceInfo": {...},
       "ipAddress": "192.168.1.1"
     }
     ```
   - API kiểm tra:
     - Tìm user trong MySQL
     - Verify password với bcrypt
     - Tạo session token
     - Update `last_activity`, `login_count`
   - Lưu user vào localStorage qua `userManager`
   - Dispatch event `userUpdated`
   - Redirect đến `/dashboard`

2. **Đăng nhập bằng OAuth**:
   - User click "Đăng nhập với Google/Facebook/GitHub"
   - NextAuth xử lý OAuth flow
   - Callback → Gọi API `/api/auth-callback`
   - API tạo hoặc update user trong MySQL
   - Lưu vào localStorage
   - Redirect đến `/dashboard`

---

## 🗄️ DATABASE (MySQL)

### Tables chính:

1. **users**:
   - `id`, `uid`, `email`, `name`, `password_hash`, `balance`, `role`, `status`, `created_at`, `updated_at`

2. **deposits**:
   - `id`, `user_id`, `amount`, `method`, `transaction_id`, `status`, `approved_time`, `approved_by`, `created_at`

3. **withdrawals**:
   - `id`, `user_id`, `amount`, `bank_name`, `account_number`, `account_name`, `status`, `approved_time`, `approved_by`, `created_at`

4. **purchases**:
   - `id`, `user_id`, `product_id`, `amount`, `created_at`

5. **chats**:
   - `id`, `user_id`, `message`, `is_admin`, `created_at`

6. **user_profiles**:
   - `id`, `user_id`, `name`, `phone`, `address`, `avatar_url`, `two_factor_enabled`, `created_at`, `updated_at`

---

## 🔄 REAL-TIME UPDATES

### Event System:
- `userUpdated`: Khi user data được cập nhật
- `depositsUpdated`: Khi có deposit mới hoặc được duyệt
- `withdrawalsUpdated`: Khi có withdrawal mới hoặc được duyệt
- `notificationsUpdated`: Khi có notification mới

### Polling:
- Dashboard: Refresh data mỗi 30 giây
- Chat: Polling mỗi 2-2.5 giây
- Balance: Refresh mỗi 2 phút, hoặc ngay lập tức khi có event

---

## ✅ ĐÃ SỬA CÁC PHẦN CÒN THIẾU/SAI

1. ✅ **Thêm logic refresh balance ngay lập tức** khi có deposit/withdrawal được approve
2. ✅ **ChatWidget đã được thêm vào ClientLayout** - hiển thị trên tất cả trang
3. ✅ **Logic approve deposit/withdrawal đã đúng** - tự động cộng/trừ balance
4. ✅ **Tất cả API đã chuyển sang MySQL** - không còn PostgreSQL
5. ✅ **Real-time updates hoạt động đúng** - polling và event system

---

## 📝 KẾT LUẬN

Hệ thống đã hoàn chỉnh với:
- ✅ Đầy đủ chức năng nạp/rút tiền
- ✅ Chat real-time với AI auto-reply
- ✅ Quản lý users và transactions
- ✅ Real-time balance updates
- ✅ Database MySQL hoạt động ổn định
- ✅ UI/UX hiện đại với Liquid Glass effects

Tất cả các chức năng đã được kiểm tra và hoạt động đúng logic!

