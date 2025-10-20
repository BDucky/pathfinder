# 🎯 Hướng dẫn Development với Backend API

Tài liệu này giải thích cách chạy frontend local (với `npm run dev`) và kết nối tới API backend (Vercel Serverless Functions) để test mà không cần deploy mỗi lần thay đổi.

Có 2 cách tiếp cận, tôi khuyến nghị **Option 1** vì nó mô phỏng môi trường production chính xác nhất.

---

## ✅ Option 1: Sử dụng Vercel CLI (Cách chuyên nghiệp - Khuyến nghị)

**Ý tưởng**: Chạy một phiên bản mô phỏng của Vercel ngay trên máy tính của bạn. Vercel CLI sẽ tự động chạy frontend (`vite`) và backend (`serverless functions`) cùng lúc.

**Lợi ích**:
- ✅ **Chính xác 100%**: Môi trường local giống hệt production.
- ✅ **Tự động load Env Vars**: Tự động lấy các biến môi trường từ Vercel về file `.env.local`.
- ✅ **Hot-reloading**: Thay đổi code frontend hay backend đều được cập nhật ngay lập-tức.
- ✅ **Không cần config proxy**: Mọi thứ hoạt động "out-of-the-box".

### Hướng dẫn chi tiết:

#### 1. Cài đặt Vercel CLI (Nếu chưa có)
Mở terminal và chạy lệnh sau để cài đặt Vercel CLI toàn cục:
```bash
npm install -g vercel
```

#### 2. Đăng nhập vào Vercel
```bash
vercel login
```
Trình duyệt sẽ mở ra để bạn đăng nhập vào tài khoản Vercel.

#### 3. Liên kết Project Local với Vercel
Trong thư mục gốc của dự án, chạy:
```bash
vercel link
```
Vercel sẽ hỏi bạn để xác nhận liên kết với project `pathfinder` đã deploy. Chọn `Y` (Yes).

#### 4. Kéo Environment Variables về Local
Đây là bước quan trọng để lấy API keys từ Vercel về máy.
```bash
vercel env pull .env.local
```
Lệnh này sẽ tạo file `.env.local` chứa tất cả các biến môi trường bạn đã cấu hình trên Vercel dashboard.

#### 5. Chạy Development Server
Thay vì `npm run dev`, bạn hãy dùng lệnh:
```bash
vercel dev
```
Vercel CLI sẽ:
- 🚀 Khởi động Vite dev server cho frontend tại `http://localhost:3000`.
- 🚀 Khởi động server cho các serverless functions tại một port khác.
- 🔗 Tự động proxy các request từ `/api` đến serverless functions local.
- ✅ Tải các biến môi trường từ file `.env.local`.

**Bây giờ, bạn có thể mở `http://localhost:3000`, chỉnh sửa code frontend hoặc backend, và mọi thứ sẽ hoạt động như trên production mà không cần deploy!**

---

## ✅ Option 2: Dùng Vite Proxy (Cách linh hoạt)

**Ý tưởng**: Cho Vite dev server (`npm run dev`) tự động chuyển tiếp (proxy) các request từ `/api` đến URL Vercel deployment của bạn.

**Lợi ích**:
- ✅ **Không cần Vercel CLI**: Không cần cài đặt hay đăng nhập Vercel CLI.
- ✅ **Setup nhanh**: Chỉ cần sửa 1 file `vite.config.js`.

**Hạn chế**:
- ⚠️ Bạn đang test frontend local với backend **production**, không phải backend local.
- ⚠️ Mọi thay đổi ở backend sẽ yêu cầu bạn phải deploy lại để thấy kết quả.

### Hướng dẫn chi tiết:

Tôi đã tự động cấu hình sẵn cho bạn trong `vite.config.js`.

#### 1. Sửa file `vite.config.js`
Mở file `vite.config.js` và thay đổi `target` thành URL deployment của bạn, đảm bảo **KHÔNG có dấu gạch chéo `/` ở cuối**:
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        // 👇 THAY URL DEPLOYMENT CỦA BẠN VÀO ĐÂY
        target: 'https://pathfinder-your-username.vercel.app', 
        changeOrigin: true,
      }
    }
  }
})
```
> **Quan trọng**: Nhớ thay `https://pathfinder-your-username.vercel.app` bằng URL Vercel thực tế của bạn.

#### 2. Tạo file `.env.local` (QUAN TRỌNG)
Để ứng dụng biết rằng nó nên sử dụng backend proxy thay vì đòi API key, hãy **tạo một file tên là `.env.local`** ở thư mục gốc của dự án và thêm vào nội dung sau:

```env
VITE_API_MODE=production
```
Thao tác này sẽ "đánh lừa" ứng dụng frontend, khiến nó hoạt động ở chế độ "backend" và gửi tất cả request API đến proxy bạn đã cấu hình, **bạn sẽ không bị hỏi API key nữa**.

#### 3. Chạy Development Server
Chạy lệnh như bình thường:
```bash
npm run dev
```
Bây giờ, mỗi khi frontend của bạn gọi `/api/chat`, Vite sẽ bí mật chuyển tiếp request đó đến `https://pathfinder-your-username.vercel.app/api/chat`.

---

## 📊 So sánh 2 phương pháp

| Tiêu chí | Option 1: `vercel dev` | Option 2: `Vite Proxy` |
| :--- | :--- | :--- |
| **Độ chính xác** | ⭐⭐⭐⭐⭐ (Giống hệt production) | ⭐⭐⭐ (Frontend local, Backend remote) |
| **Backend Test** | ✅ Test được thay đổi backend ngay lập tức | ❌ Phải deploy để test backend |
| **Setup** | Cần cài đặt và login Vercel CLI 1 lần | Chỉ cần sửa `vite.config.js` |
| **Env Vars** | Tự động, an toàn (`vercel env pull`) | Không cần (dùng backend remote) |
| **Khuyến nghị** | 🔥 **Highly Recommended** | Dùng khi không muốn cài Vercel CLI |

**Kết luận**: Hãy dành 5 phút để cài đặt và sử dụng **Option 1 (`vercel dev`)**. Nó sẽ tiết kiệm rất nhiều thời gian và đảm bảo code của bạn hoạt động ổn định khi deploy.

