# Quizrise Backend API

## 📖 Tổng quan

**Quizrise** là hệ thống tạo và quản lý quiz học từ vựng tiếng Anh được hỗ trợ bởi AI Google Gemini. Hệ thống cho phép:

- 🤖 **Tạo quiz tự động** từ văn bản tiếng Việt bằng AI Gemini
- 👥 **Chia sẻ quiz** giữa người dùng (chỉ Admin)
- 📊 **Theo dõi kết quả** học tập và tiến độ
- 🎯 **Quản lý kỹ năng** theo từng chủ đề
- 📅 **Lịch ôn tập** thông minh

## 🏗️ Kiến trúc hệ thống

### Core Domains
- **Quiz Generation**: Tạo flashcard từ AI với IPA, mnemonic
- **Quiz Submissions**: Kiểm tra và chấm điểm tự động
- **Skills Management**: Theo dõi tiến độ học theo chủ đề
- **User Management**: Xác thực, phân quyền, chia sẻ quiz

### Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **AI Service**: Google Gemini (failover với nhiều API keys)
- **Authentication**: JWT (Access + Refresh tokens)
- **Validation**: Zod schemas

## 🚀 Cài đặt & chạy

### Yêu cầu hệ thống
- Node.js 18+
- MongoDB (local hoặc Atlas)
- Google Gemini API keys

### 1. Clone và cài đặt
```bash
git clone <repository-url>
cd quizrise-backend
npm install
```

### 2. Cấu hình môi trường
Tạo file `.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/quizrise
# Hoặc MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quizrise

# Google Gemini API (failover)
GEMINI_API_KEY_1=your_primary_gemini_api_key
GEMINI_API_KEY_2=your_backup_gemini_api_key

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_token_secret

# Learning Config
SKILL=A2-B1
```

### 3. Chạy ứng dụng

```bash
# Development với nodemon
npm run dev

# Production
npm start

# Với Docker
docker-compose up
```

Server sẽ chạy tại: `http://localhost:3001`

## 👤 Hệ thống phân quyền

### Roles
- **Admin**: 
  - ✅ Tạo quiz
  - ✅ Xem tất cả users
  - ✅ Chia sẻ quiz với bất kỳ ai
  - ✅ Truy cập tất cả quiz
  
- **User**: 
  - ❌ Không tạo quiz
  - ❌ Không xem danh sách users
  - ❌ Không chia sẻ quiz
  - ✅ Xem quiz của mình + quiz được chia sẻ

## 📋 API Documentation

### 🔐 Authentication APIs

```bash
# Đăng ký
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Tên User"
}

# Đăng nhập
POST /api/auth/login
{
  "email": "user@example.com", 
  "password": "password123"
}

# Refresh token
POST /api/auth/refresh-token
{
  "refreshToken": "your_refresh_token"
}

# Lấy profile
GET /api/auth/profile
Headers: Authorization: Bearer <access_token>

# Lấy danh sách users (Admin only)
GET /api/auth/users?search=john&page=1&limit=20
Headers: Authorization: Bearer <admin_access_token>
```

### 📝 Quiz Management APIs

```bash
# Tạo quiz từ văn bản (Admin only)
POST /api/quizzes
Headers: Authorization: Bearer <admin_access_token>
{
  "title": "Từ vựng chủ đề gia đình",
  "text": "cha mẹ\ncon cái\nanh em\nông bà",
  "model": "gemini-1.5-flash"
}

# Lấy tất cả quiz (của mình + được chia sẻ)
GET /api/quizzes?page=1&limit=10
Headers: Authorization: Bearer <access_token>

# Lấy quiz theo loại
GET /api/quizzes/my/quizzes?type=own      # Quiz tự tạo
GET /api/quizzes/my/quizzes?type=shared   # Quiz được chia sẻ
GET /api/quizzes/my/quizzes?type=all      # Tất cả quiz

# Lấy chi tiết quiz
GET /api/quizzes/:id
Headers: Authorization: Bearer <access_token>

# Cập nhật quiz (Owner/Admin only)
PUT /api/quizzes/:id
Headers: Authorization: Bearer <access_token>
{
  "title": "Tiêu đề mới"
}

# Xóa quiz (Owner/Admin only)
DELETE /api/quizzes/:id
Headers: Authorization: Bearer <access_token>
```

### 🤝 Quiz Sharing APIs (Admin Only)

```bash
# Chia sẻ quiz với users
POST /api/quizzes/:id/share
Headers: Authorization: Bearer <admin_access_token>
{
  "userIds": ["userId1", "userId2", "userId3"]
}

# Hủy chia sẻ quiz
DELETE /api/quizzes/:id/share
Headers: Authorization: Bearer <admin_access_token>
{
  "userIds": ["userId1", "userId2"]
}

# Xem danh sách users được chia sẻ quiz
GET /api/quizzes/:id/shared-users
Headers: Authorization: Bearer <admin_access_token>
```

### 📊 Submissions APIs

```bash
# Nộp bài quiz
POST /api/submissions
Headers: Authorization: Bearer <access_token>
{
  "quiz": "quizId",
  "answers": [
    {
      "questionIndex": 0,
      "selectedChoiceIndex": 1
    }
  ]
}

# Lấy kết quả submissions
GET /api/submissions?quiz=quizId&page=1&limit=10
Headers: Authorization: Bearer <access_token>
```

### 🎯 Skills Management APIs

```bash
# Lấy danh sách skills
GET /api/skills?page=1&limit=10
Headers: Authorization: Bearer <access_token>

# Tạo skill mới
POST /api/skills
Headers: Authorization: Bearer <access_token>
{
  "name": "Family Vocabulary",
  "category": "vocabulary"
}
```

## 🤖 AI Integration

### Gemini Service Features
- **Failover system**: Tự động chuyển đổi API key khi gặp lỗi
- **Rate limiting**: Exponential backoff cho rate limit
- **Structured prompts**: Tối ưu cho học tiếng Anh với persona "Cô Trang"
- **JSON parsing**: Xử lý markdown code fence và validate JSON

### Prompt Example
```javascript
// Hệ thống tự động tạo flashcard từ:
"cha mẹ\ncon cái\nanh em"

// Thành quiz structure:
{
  "questions": [
    {
      "prompt": "Từ tiếng Anh của 'cha mẹ' là gì?",
      "choices": [
        { "text": "parents /ˈperənts/", "isCorrect": true },
        { "text": "children", "isCorrect": false },
        { "text": "siblings", "isCorrect": false },
        { "text": "family", "isCorrect": false }
      ],
      "explanation": "Parents nghĩa là cha mẹ..."
    }
  ]
}
```

## 🗄️ Database Schema

### User Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  name: String,
  role: 'user' | 'admin',
  isActive: Boolean,
  vocabularyStreak: Number,
  totalQuizzesCompleted: Number,
  averageScore: Number
}
```

### Quiz Model
```javascript
{
  title: String,
  sourceText: String,
  model: String,
  questions: [QuestionSchema],
  createdBy: ObjectId (User),
  sharedWith: [ObjectId] (Users), // 🆕 Feature mới
  timestamps: true
}
```

### Question Schema
```javascript
{
  prompt: String,
  choices: [ChoiceSchema],
  explanation: String
}
```

## 🐳 Docker Deployment

```bash
# Build và chạy với Docker Compose
docker-compose up --build

# Chỉ chạy MongoDB
docker-compose up mongodb

# Production build
docker build -t quizrise-backend .
docker run -p 3001:3001 --env-file .env quizrise-backend
```

## 🧪 Testing

```bash
# Import Postman collections
# File: postman/Quizrise.postman_collection.json

# Hoặc test với curl:
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","name":"Test User"}'
```

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3001 | Server port |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `GEMINI_API_KEY_1` | Yes | - | Primary Gemini API key |
| `GEMINI_API_KEY_2` | No | - | Backup Gemini API key |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `JWT_REFRESH_SECRET` | Yes | - | Refresh token secret |
| `SKILL` | No | A2-B1 | Learning level |

## 🎯 Roadmap

- [ ] **Real-time notifications** cho quiz sharing
- [ ] **Advanced analytics** cho learning progress
- [ ] **Voice pronunciation** integration
- [ ] **Mobile app** API optimization
- [ ] **Multi-language** support
- [ ] **Offline mode** capabilities

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/quiz-sharing`
3. Commit changes: `git commit -m 'Add quiz sharing feature'`
4. Push branch: `git push origin feature/quiz-sharing`
5. Tạo Pull Request

## 📄 License

MIT License - xem file `LICENSE` để biết thêm chi tiết.

## 🆘 Support

- **Documentation**: Xem file `.md` trong thư mục gốc
- **Postman Collections**: Import từ thư mục `postman/`
- **Issues**: Tạo issue trên GitHub repository

---

**Developed with ❤️ by Quizrise Team**

