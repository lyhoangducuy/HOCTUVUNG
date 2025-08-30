# Hướng dẫn sử dụng Google Gemini API

## 1. Lấy API Key

1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Đăng nhập bằng tài khoản Google
3. Tạo API key mới
4. Copy API key và lưu vào biến môi trường

## 2. Cấu hình trong dự án

### Cách 1: Sử dụng biến môi trường
Tạo file `.env` trong thư mục gốc:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

### Cách 2: Lưu trực tiếp trong code (không khuyến khích)
```javascript
const GEMINI_API_KEY = "your_api_key_here";
```

## 3. Cấu trúc API Request

### Endpoint
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY
```

### Request Body
```javascript
{
  "contents": [
    {
      "parts": [
        {
          "text": "Your prompt here"
        }
      ]
    }
  ]
}
```

### Response Structure
```javascript
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "AI response here"
          }
        ]
      }
    }
  ]
}
```

## 4. Ví dụ sử dụng trong React

```javascript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function askGemini(prompt) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error);
    throw error;
  }
}

// Sử dụng trong component
const analyzeDataWithAI = async (data) => {
  const prompt = `
    Phân tích dữ liệu thống kê của ứng dụng học từ vựng:
    
    DỮ LIỆU HIỆN TẠI:
    - Tổng người dùng: ${data.users.length}
    - Tổng khóa học: ${data.classes.length} 
    - Tổng bộ thẻ: ${data.cards.length}
    - Doanh thu tháng này: ${data.revenue.monthRevenue?.toLocaleString('vi-VN')} VNĐ
    
    Hãy phân tích và đưa ra insights chi tiết bằng tiếng Việt.
  `;

  try {
    const analysis = await askGemini(prompt);
    return analysis;
  } catch (error) {
    throw new Error('Không thể kết nối Gemini API');
  }
};
```

## 5. Các model có sẵn

- `gemini-1.5-flash`: Nhanh, phù hợp cho chat và phân tích
- `gemini-1.5-pro`: Mạnh hơn, phù hợp cho tác vụ phức tạp
- `gemini-1.0-pro`: Phiên bản ổn định

## 6. Giới hạn và chi phí

- **Free tier**: 15 requests/minute
- **Paid tier**: $0.00025 / 1K characters input, $0.0005 / 1K characters output

## 7. Lưu ý bảo mật

1. **KHÔNG** commit API key vào Git
2. Sử dụng biến môi trường
3. Thêm `.env` vào `.gitignore`
4. Kiểm tra logs để tránh lộ thông tin nhạy cảm

## 8. Xử lý lỗi

```javascript
try {
  const result = await askGemini(prompt);
  return result;
} catch (error) {
  if (error.message.includes('429')) {
    console.error('Rate limit exceeded');
  } else if (error.message.includes('401')) {
    console.error('Invalid API key');
  } else {
    console.error('Unknown error:', error);
  }
  throw error;
}
```

## 9. So sánh với OpenRouter

| Tính năng | OpenRouter | Gemini API |
|-----------|------------|------------|
| Setup | Phức tạp hơn | Đơn giản |
| Chi phí | Thay đổi theo model | Cố định |
| Tốc độ | Nhanh | Rất nhanh |
| Độ ổn định | Tốt | Rất tốt |
| Hỗ trợ tiếng Việt | Tốt | Rất tốt |

## 10. Migration từ OpenRouter

### Thay đổi endpoint:
```javascript
// Cũ (OpenRouter)
fetch("https://openrouter.ai/api/v1/chat/completions", {
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "model": "google/gemma-3-4b-it:free",
    "messages": [{ "role": "user", "content": prompt }]
  })
});

// Mới (Gemini)
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "contents": [{ "parts": [{ "text": prompt }] }]
  })
});
```

### Thay đổi response parsing:
```javascript
// Cũ (OpenRouter)
const analysis = result?.choices?.[0]?.message?.content || "";

// Mới (Gemini)
const analysis = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
```

