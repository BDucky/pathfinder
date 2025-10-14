# 🚀 Hướng dẫn Deploy Pathfinder lên Vercel

Tài liệu này hướng dẫn chi tiết cách deploy ứng dụng Pathfinder lên Vercel với Serverless Functions, giúp ứng dụng của bạn có thể được sử dụng rộng rãi mà không cần người dùng tự cấu hình API keys.

---

## 📋 Mục lục

1. [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
2. [Yêu cầu trước khi bắt đầu](#yêu-cầu-trước-khi-bắt-đầu)
3. [Bước 1: Chuẩn bị API Keys](#bước-1-chuẩn-bị-api-keys)
4. [Bước 2: Push code lên GitHub](#bước-2-push-code-lên-github)
5. [Bước 3: Deploy lên Vercel](#bước-3-deploy-lên-vercel)
6. [Bước 4: Cấu hình Environment Variables](#bước-4-cấu-hình-environment-variables)
7. [Bước 5: Kiểm tra deployment](#bước-5-kiểm-tra-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Chi phí & Giới hạn](#chi-phí--giới-hạn)

---

## 🏗️ Tổng quan kiến trúc

Ứng dụng Pathfinder hỗ trợ **2 chế độ hoạt động**:

### 1. **Client Mode** (Development/Self-hosted)
- Người dùng tự nhập API keys trong trình duyệt
- API keys lưu trong localStorage
- Phù hợp cho development hoặc self-hosted

### 2. **Backend Mode** (Production với Vercel)
- API keys được giấu an toàn trên server
- Người dùng không cần cấu hình gì
- Sử dụng Vercel Serverless Functions
- Rate limiting tự động
- Phù hợp cho public deployment

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌──────────────────┐
│ Vercel Edge     │──────│ Serverless API   │
│ (Static Files)  │      │  /api/*          │
└─────────────────┘      └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
              ┌─────────┐   ┌─────────┐   ┌─────────┐
              │ Gemini  │   │  Groq   │   │ YouTube │
              │   API   │   │   API   │   │   API   │
              └─────────┘   └─────────┘   └─────────┘
```

---

## ✅ Yêu cầu trước khi bắt đầu

- [ ] Tài khoản GitHub (miễn phí)
- [ ] Tài khoản Vercel (miễn phí) - [Đăng ký tại đây](https://vercel.com/signup)
- [ ] Git đã cài đặt trên máy
- [ ] Node.js v18+ đã cài đặt

---

## 🔑 Bước 1: Chuẩn bị API Keys

Trước khi deploy, bạn cần có **ít nhất 2 API keys bắt buộc** (khuyến nghị có cả 3):

### 1.1. Google Gemini API Key (BẮT BUỘC)

**Công dụng**: Tạo lộ trình học tập bằng AI

**Cách lấy**:
1. Truy cập: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Đăng nhập bằng Google Account
3. Click nút **"Create API Key"**
4. Copy API key (dạng: `AIza...`)
5. Lưu lại an toàn

**Free tier**: 60 requests/phút

### 1.2. YouTube Data API Key (BẮT BUỘC)

**Công dụng**: Tìm kiếm video học liệu từ YouTube

**Cách lấy**:
1. Truy cập: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Tạo project mới (hoặc chọn project có sẵn)
   - Click **"Select a project"** → **"New Project"**
   - Đặt tên project (vd: "Pathfinder")
   - Click **"Create"**

3. Enable YouTube Data API v3:
   - Vào menu **"APIs & Services"** → **"Library"**
   - Tìm kiếm: **"YouTube Data API v3"**
   - Click vào API → Click **"Enable"**

4. Tạo API Key:
   - Vào **"APIs & Services"** → **"Credentials"**
   - Click **"+ Create Credentials"** → **"API Key"**
   - Copy API key (dạng: `AIza...`)
   - (Tùy chọn) Click **"Restrict Key"** để bảo mật hơn

5. Lưu lại an toàn
**Free tier**: 10,000 units/ngày

### 1.3. Groq API Key (TÙY CHỌN - Khuyến nghị)

**Công dụng**: Chat AI siêu nhanh với Llama 3.3 70B

**Cách lấy**:
1. Truy cập: [https://console.groq.com](https://console.groq.com)
2. Sign up với Google/GitHub/Email
3. Vào mục **"API Keys"** ở sidebar
4. Click **"Create API Key"**
5. Đặt tên key (vd: "Pathfinder Production")
6. Copy API key (dạng: `gsk_...`)
7. Lưu lại an toàn
**Free tier**: 30 requests/phút

> 💡 **Lưu ý bảo mật**: 
> - KHÔNG share API keys công khai
> - KHÔNG commit API keys vào Git
> - Chỉ nhập API keys vào Vercel Dashboard

---

## 📦 Bước 2: Push code lên GitHub

### 2.1. Tạo GitHub Repository

1. Truy cập [https://github.com/new](https://github.com/new)
2. Đặt tên repository (vd: `pathfinder`)
3. Chọn **Public** hoặc **Private** (tùy bạn)
4. KHÔNG chọn "Add README" (đã có sẵn)
5. Click **"Create repository"**

### 2.2. Push code

Mở terminal trong thư mục project và chạy:

```bash
# Initialize git (nếu chưa có)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for deployment"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/pathfinder.git

# Push to GitHub
git push -u origin main
```

> Thay `YOUR_USERNAME` bằng username GitHub của bạn

---

## 🌐 Bước 3: Deploy lên Vercel

### 3.1. Kết nối GitHub với Vercel

1. Truy cập [https://vercel.com/](https://vercel.com/)
2. Click **"Sign Up"** (hoặc **"Log In"** nếu đã có tài khoản)
3. Chọn **"Continue with GitHub"**
4. Authorize Vercel truy cập GitHub của bạn

### 3.2. Import Project

1. Click **"Add New..."** → **"Project"**
2. Chọn repository `pathfinder` từ danh sách
3. Click **"Import"**

### 3.3. Cấu hình Project

Vercel sẽ tự động detect Vite project. **QUAN TRỌNG**: Kiểm tra các settings sau:

- **Framework Preset**: `Vite` ✅
- **Root Directory**: `./` (để trống - mặc định) ✅
- **Build Command**: **BỎ TRỐNG hoặc để `npm run build`** ⚠️
  - ❌ KHÔNG để `vite build` (sẽ lỗi!)
  - ✅ Để trống để dùng setting từ `vercel.json`
  - ✅ Hoặc nhập: `npm run build`
- **Output Directory**: `dist` ✅
- **Install Command**: Để trống (auto-detect) ✅

> 💡 **Lưu ý quan trọng**: Nếu Build Command có sẵn giá trị `vite build`, hãy **XÓA NÓ ĐI** và để trống!

Nhấn **"Deploy"** (chưa cần cấu hình Environment Variables - sẽ làm sau)

### 3.4. Đợi build xong

Vercel sẽ build project (khoảng 1-2 phút). Bạn sẽ thấy:
- ✅ Building...
- ✅ Deploying...
- 🎉 Success!

> ⚠️ **Lưu ý**: Lần deploy đầu tiên sẽ LỖI nếu chưa có Environment Variables. Đây là bình thường!

---

## ⚙️ Bước 4: Cấu hình Environment Variables

Đây là bước QUAN TRỌNG NHẤT!

### 4.1. Truy cập Project Settings

1. Trong Vercel Dashboard, click vào project `pathfinder`
2. Click tab **"Settings"**
3. Click **"Environment Variables"** ở sidebar

### 4.2. Thêm API Keys

Thêm **3 Environment Variables** sau:

#### Variable 1: GEMINI_API_KEY
- **Key**: `GEMINI_API_KEY`
- **Value**: `AIza...` (Gemini API key của bạn)
- **Environments**: Chọn **Production**, **Preview**, và **Development**
- Click **"Save"**

#### Variable 2: YOUTUBE_API_KEY
- **Key**: `YOUTUBE_API_KEY`
- **Value**: `AIza...` (YouTube API key của bạn)
- **Environments**: Chọn **Production**, **Preview**, và **Development**
- Click **"Save"**

#### Variable 3: GROQ_API_KEY (Tùy chọn)
- **Key**: `GROQ_API_KEY`
- **Value**: `gsk_...` (Groq API key của bạn)
- **Environments**: Chọn **Production**, **Preview**, và **Development**
- Click **"Save"**

#### Variable 4: VITE_API_MODE
- **Key**: `VITE_API_MODE`
- **Value**: `production`
- **Environments**: Chọn **Production** và **Preview**
- Click **"Save"**

### 4.3. Redeploy với Environment Variables

1. Quay lại tab **"Deployments"**
2. Click vào deployment mới nhất
3. Click menu **"..."** → **"Redeploy"**
4. Click **"Redeploy"**

Vercel sẽ build lại với Environment Variables mới.

---

## ✅ Bước 5: Kiểm tra Deployment

### 5.1. Truy cập ứng dụng

1. Sau khi deploy xong, click **"Visit"**
2. Hoặc copy URL (dạng: `https://pathfinder-xxx.vercel.app`)

### 5.2. Test các tính năng

**Test 1: Tạo lộ trình học**
1. Không cần cấu hình API keys (đã có backend!)
2. Nhập thông tin:
   - Topic: "Python Programming"
   - Level: "Beginner"
   - Duration: 4 weeks
   - Hours/week: 10
3. Click **"Tạo Lộ Trình AI"**
4. Đợi 10-15 giây
5. ✅ Xem kết quả với video YouTube

**Test 2: AI Chat**
1. Click icon chat 💬 ở góc dưới phải
2. Gõ: "Giải thích về Python variables"
3. ✅ AI sẽ trả lời (dùng Gemini hoặc Groq)

**Test 3: Chuyển AI Provider**
1. Trong chat window, chuyển giữa Gemini và Groq
2. ✅ Cả 2 đều hoạt động

### 5.3. Kiểm tra console

Mở DevTools (F12) → Console:
- ✅ KHÔNG có lỗi màu đỏ
- ✅ Có log: `API Mode: backend`

---

## 🐛 Troubleshooting

### Lỗi 0: "vite: command not found" hoặc "Command 'vite build' exited with 127"

**Nguyên nhân**: Build command sai trong Vercel Dashboard

**Giải pháp**:
1. Vào project trong Vercel
2. Click **Settings** → **General**
3. Scroll xuống phần **Build & Development Settings**
4. Tìm **Build Command**:
   - Nếu có giá trị `vite build` → **XÓA NÓ** và để trống
   - Hoặc đổi thành: `npm run build`
5. Click **"Save"**
6. Vào tab **Deployments** → Redeploy

**Hoặc nhanh hơn**:
```bash
# Commit lại vercel.json (đã được fix)
git add vercel.json
git commit -m "Fix build command"
git push

# Vercel sẽ tự động deploy lại
```

### Lỗi 1: "API not configured"

**Nguyên nhân**: Chưa có Environment Variables

**Giải pháp**:
1. Vào **Settings** → **Environment Variables**
2. Kiểm tra đã có đủ 3 variables chưa
3. Redeploy project

### Lỗi 2: "API key not valid"

**Nguyên nhân**: API key sai hoặc hết hạn

**Giải pháp**:
1. Kiểm tra lại API key
2. Với Gemini: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
3. Với YouTube: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
4. Với Groq: [https://console.groq.com/keys](https://console.groq.com/keys)
5. Update lại trong Vercel
6. Redeploy

### Lỗi 3: "Quota exceeded"

**Nguyên nhân**: Hết quota API miễn phí

**Giải pháp**:
1. **Gemini**: Đợi 1 phút (60 req/min limit)
2. **YouTube**: Đợi đến ngày mai (10k units/day limit)
3. **Groq**: Đợi 1 phút (30 req/min limit)
4. Hoặc nâng cấp lên paid plan

### Lỗi 4: Serverless Function timeout

**Nguyên nhân**: Request AI mất >10 giây

**Giải pháp**:
1. Đây là giới hạn của Vercel free tier
2. Nâng cấp lên Vercel Pro (timeout 60s)
3. Hoặc tối ưu prompt để response nhanh hơn

### Lỗi 5: Build failed

**Nguyên nhân**: Missing dependencies hoặc syntax error

**Giải pháp**:
1. Check logs trong Vercel
2. Test local: `npm run build`
3. Fix lỗi và commit lại
4. Vercel tự động redeploy

---

## 💰 Chi phí & Giới hạn

### Vercel (Hosting)
- ✅ **Free tier**: 
  - 100GB bandwidth/tháng
  - 100GB-Hours Serverless Functions
  - Unlimited projects
  - Custom domains
- 💰 **Pro**: $20/tháng (nếu cần timeout dài hơn)

### Google Gemini API
- ✅ **Free tier**: 
  - 60 requests/phút
  - ~1,500 requests/ngày
  - Đủ cho 100-200 users/ngày
- 💰 **Paid**: Rất rẻ (~$0.001/request)

### YouTube Data API
- ✅ **Free tier**: 
  - 10,000 units/ngày
  - 1 search = 100 units
  - = 100 searches/ngày
  - Đủ cho ~30 lộ trình/ngày
- 💰 **Paid**: $0 (không có paid tier, chỉ cần enable billing)

### Groq API
- ✅ **Free tier**: 
  - 30 requests/phút
  - ~15,000 requests/ngày
  - Đủ cho vài trăm users
- 💰 **Paid**: Coming soon

### Tổng kết
- 🎉 **100% MIỄN PHÍ** cho ~50-100 active users/ngày
- ⚠️ Nếu vượt quota, cân nhắc:
  - Enable billing cho YouTube (vẫn gần như free)
  - Upgrade Vercel Pro nếu cần
  - Implement aggressive rate limiting

---

## 🎯 Custom Domain (Optional)

### Thêm domain riêng

1. Mua domain từ Namecheap, GoDaddy, v.v...
2. Trong Vercel, vào **Settings** → **Domains**
3. Click **"Add"**
4. Nhập domain (vd: `pathfinder.com`)
5. Follow hướng dẫn config DNS
6. Đợi DNS propagate (~1-24 giờ)
7. ✅ Xong!

### Domain miễn phí

Sử dụng subdomain từ:
- **Vercel**: `your-app.vercel.app` (mặc định)
- **Freenom**: Đăng ký domain `.tk`, `.ml`, `.ga` miễn phí

---

## 🔄 Automatic Deployments

Vercel tự động deploy mỗi khi bạn push code:

```bash
# Thay đổi code
git add .
git commit -m "Update feature"
git push

# Vercel tự động:
# 1. Detect push
# 2. Build project
# 3. Deploy to production
# 4. Update URL
```

**Preview Deployments**:
- Mỗi Pull Request tạo preview URL riêng
- Test trước khi merge vào main
- Tự động xóa sau khi merge

---

## 📊 Monitoring

### Xem logs

1. Vào project trong Vercel
2. Tab **"Deployments"** → Click deployment
3. Tab **"Functions"** → Xem logs realtime
4. Filter by `/api/generate-path`, `/api/chat`, v.v...

### Analytics

1. Tab **"Analytics"** (Vercel Pro feature)
2. Xem visitors, page views, function invocations
3. Free alternative: Google Analytics

---

## 🎉 Hoàn tất!

Chúc mừng! Bạn đã deploy thành công Pathfinder lên Vercel. 

**Ứng dụng giờ đây**:
- ✅ Accessible globally
- ✅ HTTPS enabled
- ✅ Auto-scaling
- ✅ API keys được giấu an toàn
- ✅ Người dùng không cần config gì

**Next steps**:
- 📢 Share URL với bạn bè
- 📊 Monitor usage
- 🚀 Add thêm features
- 💬 Collect feedback

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Check [Troubleshooting](#troubleshooting) section
2. Xem logs trong Vercel
3. Create issue trên GitHub
4. Tham gia Discord/Telegram group (nếu có)

**Useful Links**:
- [Vercel Documentation](https://vercel.com/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Groq Console](https://console.groq.com/)
- [YouTube API Docs](https://developers.google.com/youtube/v3)

---

Made with ❤️ - Happy Learning! 🚀📚

