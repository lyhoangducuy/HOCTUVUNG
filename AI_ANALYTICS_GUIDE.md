# Hướng dẫn sử dụng Hệ thống AI Phân tích Thống kê

## 🚀 Tổng quan

Hệ thống AI phân tích thống kê đã được tích hợp vào trang Admin để cung cấp insights thông minh và dự báo dựa trên dữ liệu thực tế của ứng dụng học từ vựng.

## 📊 Các Component AI

### 1. **AISummary** - Phân tích tổng quan
- **Vị trí**: Component đầu tiên trong trang thống kê
- **Chức năng**: 
  - Phân tích tổng quan về tình hình hiện tại
  - Đánh giá điểm mạnh và điểm yếu
  - Đề xuất cải thiện cụ thể
  - Cảnh báo vấn đề cần chú ý

### 2. **AITrendAnalysis** - Phân tích xu hướng & Dự báo
- **Vị trí**: Component thứ hai
- **Chức năng**:
  - Phân tích xu hướng tăng trưởng
  - Dự báo 30 ngày tới
  - Phân tích rủi ro
  - Đề xuất chiến lược

### 3. **AIUserBehavior** - Phân tích hành vi người dùng
- **Vị trí**: Component thứ ba
- **Chức năng**:
  - Phân tích hành vi người dùng
  - Đánh giá mức độ hoạt động
  - Phân tích nội dung được tạo
  - Đề xuất tăng engagement

## 🔧 Cách sử dụng

### Cập nhật API Key
1. Đảm bảo API key OpenRouter đã được cấu hình trong file `.env`:
   ```
   VITE_API_CHATBOT_KEY=sk-or-v1-YOUR_API_KEY_HERE
   ```

2. Nếu chưa có API key, làm theo hướng dẫn trong `API_KEY_GUIDE.md`

### Sử dụng các tính năng AI

#### Tự động phân tích
- Các component AI sẽ tự động phân tích khi trang được load
- Dữ liệu được cập nhật real-time từ Firestore

#### Cập nhật thủ công
- Mỗi component có nút "Cập nhật AI" để refresh phân tích
- Hữu ích khi muốn có insights mới nhất

#### Xử lý lỗi
- Nếu API key không hợp lệ, hệ thống sẽ hiển thị thông báo lỗi
- Fallback analysis sẽ được hiển thị khi AI không khả dụng

## 📈 Dữ liệu được phân tích

### Dữ liệu người dùng
- Tổng số người dùng
- Phân loại theo vai trò (Admin, Học viên, Giảng viên)
- Người dùng mới theo thời gian (7 ngày, 30 ngày)
- Mức độ hoạt động

### Dữ liệu nội dung
- Tổng số bộ thẻ
- Tỷ lệ bộ thẻ công khai vs cá nhân
- Số lượt học của bộ thẻ
- Tổng số khóa học

### Dữ liệu doanh thu
- Doanh thu theo tháng
- Tổng doanh thu
- Xu hướng tăng trưởng

## 🎯 Lợi ích

### Cho Admin
- **Insights thông minh**: Hiểu rõ tình hình hệ thống
- **Dự báo chính xác**: Kế hoạch tăng trưởng dựa trên dữ liệu
- **Phát hiện vấn đề**: Cảnh báo sớm các rủi ro
- **Đề xuất hành động**: Chiến lược cải thiện cụ thể

### Cho Hệ thống
- **Tối ưu hóa**: Cải thiện hiệu suất dựa trên phân tích
- **Tăng trưởng**: Chiến lược phát triển bền vững
- **Trải nghiệm người dùng**: Cải thiện UX dựa trên hành vi

## 🔍 Ví dụ phân tích

### Phân tích tổng quan
```
📊 TÌNH HÌNH HIỆN TẠI:
- Hệ thống có 150 người dùng hoạt động
- Tăng trưởng 25% so với tháng trước
- Doanh thu tháng: 5,000,000 VNĐ

🎯 ĐIỂM MẠNH:
- Tỷ lệ retention cao (85%)
- Nội dung chất lượng tốt
- Engagement tích cực

⚠️ CẦN CẢI THIỆN:
- Tăng conversion rate
- Cải thiện onboarding
- Mở rộng tính năng
```

### Dự báo xu hướng
```
📈 DỰ BÁO 30 NGÀY TỚI:
- Người dùng mới: +45 người
- Doanh thu: +3,500,000 VNĐ
- Tăng trưởng: 30%

🚀 CHIẾN LƯỢC ĐỀ XUẤT:
- Tăng marketing budget
- Cải thiện UX mobile
- Phát triển tính năng mới
```

## 🛠️ Troubleshooting

### Lỗi API
- **Lỗi 401**: Kiểm tra API key
- **Lỗi 429**: Quota đã hết, chờ reset
- **Lỗi network**: Kiểm tra kết nối internet

### Dữ liệu không cập nhật
- Refresh trang
- Kiểm tra kết nối Firestore
- Xem console log để debug

### Performance
- Các component AI có thể mất 5-10 giây để phân tích
- Sử dụng nút "Cập nhật" thay vì refresh trang
- Cache kết quả để tối ưu tốc độ

## 🔮 Tính năng tương lai

- [ ] Phân tích sentiment của người dùng
- [ ] Dự báo churn rate
- [ ] Phân tích A/B testing
- [ ] Tích hợp với Google Analytics
- [ ] Export báo cáo PDF
- [ ] Alert tự động khi có vấn đề

## 📞 Hỗ trợ

Nếu gặp vấn đề với hệ thống AI:
1. Kiểm tra file `API_KEY_GUIDE.md`
2. Xem console log trong Developer Tools
3. Liên hệ team phát triển

---

*Hệ thống AI phân tích được phát triển để cung cấp insights thông minh và hỗ trợ ra quyết định dựa trên dữ liệu thực tế.*

