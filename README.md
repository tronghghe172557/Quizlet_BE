## Quizrise BE (Node.js + Express + MongoDB + Gemini)

### Yêu cầu
- Node.js 18+
- MongoDB đang chạy local hoặc connection string Atlas

### Cấu hình môi trường
Tạo file `.env` tại thư mục gốc:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/quizrise
GEMINI_API_KEY=your_google_gemini_api_key
```

### Cài đặt & chạy
```
npm install
npm run dev
```

Server: http://localhost:3000

### API

- POST `/api/quizzes`
  - body JSON: `{ "text": string, "model?": string, "createdBy?": email }`
  - tạo quiz bằng Gemini, lưu vào MongoDB

- GET `/api/quizzes`
  - query: `page`, `limit`
  - lấy danh sách quiz

- GET `/api/quizzes/:id`
  - lấy chi tiết 1 quiz

### Gợi ý prompt Gemini
Service đã hướng dẫn Gemini xuất JSON chặt chẽ. Nếu lỗi parse, kiểm tra `GEMINI_API_KEY` và quota.

### Giấy phép
MIT

