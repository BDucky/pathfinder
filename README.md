# 🎯 Pathfinder - AI Learning Path Generator

Một ứng dụng web thông minh giúp bạn tạo lộ trình học tập cá nhân hóa bằng AI, kèm theo tài nguyên học liệu miễn phí từ YouTube.

> 🌐 **Ready for Production!** Ứng dụng này có thể deploy lên Vercel để sử dụng công khai. 
> 📖 Xem hướng dẫn chi tiết tại: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

## ✨ Tính năng chính

- 🤖 **AI-Powered**: Sử dụng Google Gemini AI để tạo lộ trình học tập chi tiết
- 💬 **AI Chat Assistant**: Trợ lý AI đồng hành 24/7 - giải đáp thắc mắc, gợi ý bài tập, đánh giá tiến độ
- 🎥 **Tài nguyên tự động**: Tự động tìm kiếm video hướng dẫn phù hợp từ YouTube
- 📊 **Theo dõi tiến độ**: Đánh dấu tuần đã hoàn thành và xem tiến độ tổng thể
- 💾 **Lưu trữ cục bộ**: Tất cả dữ liệu được lưu an toàn trong trình duyệt của bạn
- ⚡ **Đa AI Provider**: Hỗ trợ cả Gemini và Groq - tự do lựa chọn AI phù hợp
- 🎨 **Giao diện đẹp**: Thiết kế hiện đại, responsive với Tailwind CSS

## 🛠️ Công nghệ sử dụng

- **Frontend**: Vue 3 (Composition API + `<script setup>`)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Routing**: Vue Router
- **AI Services**: 
  - Google Generative AI SDK (@google/generative-ai) - Gemini AI
  - Groq SDK (groq-sdk) - Llama 3.3 70B
- **APIs**: YouTube Data API v3

## 🚀 Cài đặt và Chạy

### 1. Mở thư mục dự án

```bash
cd pathfinder
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Chạy development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

### 4. Build cho production

```bash
npm run build
```

## 🔑 Cấu hình API Keys

Ứng dụng yêu cầu **2 API keys bắt buộc** và **1 API key tùy chọn**:

### 1. Google Gemini API Key (BẮT BUỘC) 🤖

1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Đăng nhập bằng tài khoản Google
3. Click "Create API Key"
4. Copy API key

**Miễn phí**: 60 requests/phút

### 2. YouTube Data API Key (BẮT BUỘC) 🎥

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable **YouTube Data API v3**:
   - Vào "APIs & Services" > "Library"
   - Tìm "YouTube Data API v3"
   - Click "Enable"
4. Tạo API Key:
   - Vào "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy API key

**Miễn phí**: 10,000 units/ngày

### 3. Groq API Key (TÙY CHỌN - Đề xuất!) ⚡

**Tại sao nên có Groq API?**
- ⚡ Tốc độ inference **cực nhanh** (nhanh hơn GPT-4)
- 🆓 **Hoàn toàn miễn phí** với 30 requests/phút
- 🧠 Sử dụng model **Llama 3.3 70B** mạnh mẽ
- 💬 Trải nghiệm chat mượt mà hơn Gemini

**Cách lấy:**
1. Truy cập [Groq Console](https://console.groq.com)
2. Đăng ký tài khoản miễn phí
3. Vào mục "API Keys"
4. Click "Create API Key"
5. Copy API key

### 4. Nhập API Keys vào ứng dụng

1. Mở ứng dụng Pathfinder
2. Click nút "⚙️ API Settings" ở góc trên phải
3. Nhập các API keys:
   - ✅ Gemini API Key (bắt buộc)
   - ✅ YouTube API Key (bắt buộc)  
   - ⭐ Groq API Key (khuyến nghị - để chat nhanh hơn)
4. Click "💾 Lưu API Keys"

## 📖 Cách sử dụng

### Tạo lộ trình học tập

1. **Cấu hình API Keys** (chỉ cần làm 1 lần)
2. **Nhập thông tin**:
   - Chủ đề muốn học (ví dụ: "Web Development", "Machine Learning")
   - Trình độ hiện tại (Beginner, Intermediate, Advanced, Expert)
   - Thời gian học (1-12 tuần)
   - Số giờ mỗi tuần (1-40 giờ)
3. **Click "✨ Tạo Lộ Trình AI"**
4. **Xem kết quả**:
   - Lộ trình chi tiết theo từng tuần
   - Mục tiêu và chủ đề cần học
   - Video hướng dẫn từ YouTube
   - Bài tập thực hành
5. **Theo dõi tiến độ**:
   - Đánh dấu tuần đã hoàn thành
   - Xem % tiến độ tổng thể

### 💬 Sử dụng AI Chat Assistant

**Tính năng AI Chat giúp bạn:**
- 📚 Giải thích khái niệm và thuật ngữ khó hiểu
- 💡 Gợi ý bài tập thực hành phù hợp
- 🎯 Đánh giá tiến độ và cho lời khuyên
- 🔍 Tóm tắt nội dung video YouTube
- ❓ Trả lời mọi câu hỏi về lộ trình học

**Cách sử dụng:**
1. Click vào icon 💬 ở góc dưới bên phải
2. Chọn AI provider (Gemini hoặc Groq) nếu có cả hai
3. Gõ câu hỏi hoặc chọn quick action:
   - 📚 Giải thích khái niệm
   - 💡 Gợi ý bài tập
   - 🎯 Đánh giá tiến độ
   - ❓ Hỏi đáp tự do
4. Chat với AI như một người bạn đồng hành!

**Mẹo sử dụng:**
- ⚡ Groq: Nhanh hơn, phù hợp chat realtime
- 🤖 Gemini: Hiểu ngữ cảnh tốt, phù hợp giải thích chi tiết
- 💾 Lịch sử chat tự động lưu trong trình duyệt
- 🔄 Có thể xóa lịch sử chat bất cứ lúc nào

## 📁 Cấu trúc dự án

```
pathfinder/
├── public/              # Static assets
├── src/
│   ├── components/      # Vue components
│   │   ├── ApiSettings.vue           # API keys configuration
│   │   ├── PathGeneratorForm.vue     # Learning path form
│   │   ├── LearningPathDisplay.vue   # Display learning path
│   │   └── ChatAssistant.vue         # AI Chat Assistant (NEW!)
│   ├── stores/          # Pinia stores
│   │   ├── path.js      # Learning path AI logic
│   │   └── chat.js      # Chat AI logic (NEW!)
│   ├── router/          # Vue Router config
│   │   └── index.js
│   ├── views/           # Page views
│   │   └── HomeView.vue
│   ├── App.vue          # Root component
│   ├── main.js          # App entry point
│   └── style.css        # Global styles + Tailwind
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🏗️ Kiến trúc Ứng dụng

Pathfinder hỗ trợ **2 chế độ hoạt động**:

### 🔑 Client Mode (Development/Self-hosted)
- Người dùng tự nhập API keys trong trình duyệt
- Keys lưu trong localStorage
- Gọi trực tiếp API từ browser
- Phù hợp: Development, personal use

### 🌐 Backend Mode (Production - Vercel)
- API keys giấu an toàn trên server
- Frontend gọi Serverless Functions
- Rate limiting tự động
- Phù hợp: Public deployment
- **Được khuyến nghị** cho ứng dụng công khai

```
Frontend (Browser) ──┬──> [Client Mode] ──> Gemini/YouTube/Groq API
                     │
                     └──> [Backend Mode] ──> Vercel Functions ──> APIs
```

Xem chi tiết: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔒 Bảo mật & Quyền riêng tư

### Client Mode
- **API keys được lưu local**: Keys chỉ lưu trong localStorage của trình duyệt
- **Bảo mật**: Người dùng tự quản lý keys của mình

### Backend Mode (Production)
- **API keys trên server**: Keys được giấu trong Vercel Environment Variables
- **Rate limiting**: Tự động chặn abuse
- **HTTPS**: Mọi request đều được mã hóa
- **No tracking**: Không thu thập dữ liệu người dùng

### Chung
- **Open source**: Code hoàn toàn minh bạch
- **No analytics**: Không có Google Analytics hay tracking scripts
- **Privacy-first**: Không lưu history chat trên server

## 🌐 Deployment

### 🚀 Deploy cho Public (Khuyến nghị)

**Để ứng dụng được sử dụng rộng rãi mà không cần người dùng tự cấu hình API keys:**

📖 **Xem hướng dẫn chi tiết tại: [DEPLOYMENT.md](./DEPLOYMENT.md)**

Hướng dẫn bao gồm:
- ✅ Deploy lên Vercel với Serverless Functions
- ✅ Cấu hình Environment Variables
- ✅ Giấu API keys an toàn trên server
- ✅ Automatic deployments từ GitHub
- ✅ Custom domain setup
- ✅ Monitoring & troubleshooting
- ✅ **100% MIỄN PHÍ** với Vercel free tier

### 🔧 Deploy cho Personal Use

**Nếu bạn chỉ muốn tự host cho riêng mình:**

#### Option 1: Vercel (Static Site)
1. Push code lên GitHub
2. Import project vào Vercel
3. Vercel tự động build và deploy
4. Người dùng tự nhập API keys trong ứng dụng

#### Option 2: Netlify
1. Build project: `npm run build`
2. Upload thư mục `dist` lên Netlify
3. Hoặc kết nối Git repository để auto-deploy

#### Option 3: GitHub Pages
1. Install gh-pages: `npm install -D gh-pages`
2. Thêm vào `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```
3. Run: `npm run deploy`

## 🐛 Xử lý lỗi thường gặp

### Lỗi "API key not valid"
- Kiểm tra lại API key đã nhập đúng chưa
- Đảm bảo YouTube Data API v3 đã được enable trong Google Cloud Console
- Đối với Groq: Key phải bắt đầu bằng `gsk_`

### Lỗi "Quota exceeded"
- **Google Gemini**: Free tier có 60 requests/phút
- **YouTube API**: Free tier có 10,000 units/ngày
- **Groq**: Free tier có 30 requests/phút
- Đợi để quota reset hoặc chuyển sang AI provider khác

### Chat AI không hoạt động
- Đảm bảo đã nhập ít nhất một AI API key (Gemini hoặc Groq)
- Thử chuyển sang AI provider khác nếu một provider bị lỗi
- Xóa cache trình duyệt và thử lại

### Không tìm được video phù hợp
- Thử thay đổi từ khóa tìm kiếm (chủ đề) cụ thể hơn
- Một số chủ đề niềm có ít tài nguyên tiếng Việt

### Lỗi CORS khi sử dụng Groq
- Groq SDK cần flag `dangerouslyAllowBrowser: true` (đã được cấu hình sẵn)
- Nếu vẫn lỗi, thử clear cache và reload

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

## 📄 License

MIT License - Tự do sử dụng cho mọi mục đích

## 👨‍💻 Tác giả

Created with ❤️ using Vue 3, Vite, Tailwind CSS & Google Gemini AI

---

**Happy Learning! 🚀📚**

