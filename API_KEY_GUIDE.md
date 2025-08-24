# Hướng dẫn lấy API Key OpenRouter mới

## 🔑 Vấn đề hiện tại
API key hiện tại đã bị lỗi 401 (Unauthorized) - "User not found"

## 📋 Các bước lấy API key mới:

### 1. Truy cập OpenRouter
- Vào trang web: https://openrouter.ai/
- Đăng ký tài khoản mới hoặc đăng nhập

### 2. Tạo API Key
- Vào phần "API Keys" trong dashboard
- Click "Create API Key"
- Đặt tên cho key (ví dụ: "HocTuVung App")
- Copy API key mới

### 3. Cập nhật file env
Thay thế API key cũ trong file `env`:
```
VITE_API_CHATBOT_KEY=sk-or-v1-YOUR_NEW_API_KEY_HERE
```

### 4. Khởi động lại server
```bash
npm run dev
```

## 🆓 Lưu ý:
- OpenRouter có gói miễn phí với giới hạn sử dụng
- Nếu hết quota, ứng dụng sẽ tự động sử dụng dữ liệu mẫu
- Các chủ đề có sẵn: "gia đình", "màu sắc", "động vật", "thức ăn"

## 🔧 Giải pháp tạm thời:
Hiện tại ứng dụng đã được cấu hình để sử dụng dữ liệu mẫu khi API lỗi, nên vẫn hoạt động bình thường.
