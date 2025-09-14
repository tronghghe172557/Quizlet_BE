# Quizrise Backend - English Vocabulary Quiz System

## � Tổng quan

Quizrise là hệ thống tạo quiz từ vựng tiếng Anh thông minh sử dụng AI (Google Gemini) để tự động sinh câu hỏi trắc nghiệm từ danh sách từ vựng. Hệ thống hỗ trợ chia sẻ quiz và quản lý quyền truy cập dựa trên vai trò người dùng.

## 🚀 Tính năng chính

### 1. **Tạo Quiz AI-Powered**
- Tự động sinh câu hỏi từ danh sách từ vựng
- Hỗ trợ nhiều dạng câu hỏi: vocabulary, grammar, reading, conversation, mixed
- Tùy chỉnh số câu hỏi, số lựa chọn, cấp độ tiếng Anh
- Failover system với nhiều API key Google Gemini

### 2. **Chia sẻ Quiz**
- Chia sẻ quiz với người dùng khác
- Quản lý quyền truy cập dựa trên role (admin/user)
- Admin có thể truy cập tất cả quiz, user chỉ truy cập quiz của mình và được chia sẻ

### 3. **Submission System**
- Nộp bài làm quiz với tính điểm tự động
- Lưu trữ lịch sử làm bài
- Phân tích kết quả chi tiết

### 4. **Skills Management**
- Quản lý kỹ năng theo danh mục
- Theo dõi tiến độ học tập

## � Cài đặt

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 6.0
- Google Gemini API Keys

### 1. Clone Repository
```bash
git clone https://github.com/tronghghe172557/Quizlet_BE.git
cd Quizlet_BE
```

### 2. Cài đặt Dependencies
```bash
npm install
```

### 3. Cấu hình Environment Variables
Tạo file `.env` trong thư mục root:

```env
# Database
MONGODB_URI=mongodb://username:password@localhost:27017/quizrise

# Server
PORT=3001

# Google Gemini API Keys (Failover system)
GEMINI_API_KEY_1=your_primary_gemini_api_key
GEMINI_API_KEY_2=your_backup_gemini_api_key_1
GEMINI_API_KEY_3=your_backup_gemini_api_key_2
# ... có thể thêm tối đa 8 keys

# Learning Configuration
SKILL=B1

# JWT Secret (for authentication)
JWT_SECRET=your_jwt_secret_key
```

### 4. Khởi chạy

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

#### Với Docker
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

