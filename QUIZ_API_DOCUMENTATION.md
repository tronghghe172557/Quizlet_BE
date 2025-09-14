# 📝 Quiz API Documentation

## 📖 Tổng quan

API quản lý quiz với đầy đủ chức năng CRUD và phân quyền. Hỗ trợ tạo, xem, cập nhật, xóa quiz với role-based access control.

## 🔐 Authentication

Tất cả API đều yêu cầu JWT token trong header:
```
Authorization: Bearer <your_access_token>
```

## 👥 Phân quyền

- **Admin**: Toàn quyền tạo, xem, sửa, xóa tất cả quiz
- **User**: Chỉ có thể xem quiz, sửa/xóa quiz của chính mình
- **Public**: Một số API cho phép truy cập không cần đăng nhập

---

# 🎯 Quiz APIs

## 1. Tạo quiz mới

**POST** `/api/quizzes`

⚠️ **Quyền hạn**: Chỉ **Admin** mới có thể tạo quiz mới.

Tạo một quiz mới với câu hỏi và đáp án.

### Request Body:
```json
{
  "title": "English Vocabulary - Chapter 1",
  "text": "Từ vựng tiếng Anh cơ bản cho người mới bắt đầu. Bao gồm các từ thường dùng trong giao tiếp hàng ngày.",
  "model": "gemini-1.5-flash"
}
```

### Parameters:
- `title` (string, required): Tiêu đề quiz
- `text` (string, required): Văn bản nguồn để AI tạo quiz (tối thiểu 10 ký tự)
- `model` (string, optional): Model AI sử dụng. Mặc định: "gemini-1.5-flash"

⚠️ **Lưu ý**: API này sử dụng AI để tự động tạo câu hỏi từ văn bản nguồn. Không cần truyền `questions` thủ công.

### Response (201):
```json
{
  "_id": "67643aa4e123456789abcdef",
  "title": "English Vocabulary - Chapter 1",
  "sourceText": "Từ vựng tiếng Anh cơ bản cho người mới bắt đầu. Bao gồm các từ thường dùng trong giao tiếp hàng ngày.",
  "model": "gemini-1.5-flash",
  "questions": [
    {
      "prompt": "Từ 'beautiful' trong tiếng Việt có nghĩa là gì?",
      "choices": [
        {
          "text": "đẹp",
          "isCorrect": true
        },
        {
          "text": "xấu",
          "isCorrect": false
        },
        {
          "text": "to",
          "isCorrect": false
        },
        {
          "text": "nhỏ",
          "isCorrect": false
        }
      ],
      "explanation": "Beautiful /ˈbjuːtɪfəl/ có nghĩa là đẹp trong tiếng Việt"
    }
  ],
  "createdBy": {
    "_id": "67643bb4e123456789abcdef",
    "fullName": "Nguyễn Văn A",
    "email": "admin@example.com"
  },
  "createdAt": "2025-09-14T10:00:00.000Z",
  "updatedAt": "2025-09-14T10:00:00.000Z"
}
```

### Lỗi phổ biến:
- **403**: Không có quyền tạo quiz (chỉ admin)
- **400**: Dữ liệu không hợp lệ (thiếu title, text quá ngắn)
- **500**: Lỗi AI service (Gemini API không khả dụng)

---

## 2. Lấy danh sách quiz của tôi

**GET** `/api/quizzes?page=1&limit=10`

Lấy danh sách quiz do user hiện tại tạo ra với phân trang.

### Query Parameters:
- `page` (number, optional): Trang hiện tại. Mặc định: 1
- `limit` (number, optional): Số quiz mỗi trang. Mặc định: 10, tối đa: 50

### Response (200):
```json
{
  "items": [
    {
      "_id": "67643aa4e123456789abcdef",
      "title": "English Vocabulary - Chapter 1",
      "sourceText": "Từ vựng tiếng Anh cơ bản...",
      "model": "gemini-1.5-flash",
      "questions": [
        {
          "prompt": "Từ 'beautiful' trong tiếng Việt có nghĩa là gì?",
          "choices": [
            {
              "text": "đẹp",
              "isCorrect": true
            }
          ]
        }
      ],
      "createdBy": {
        "_id": "67643bb4e123456789abcdef",
        "fullName": "Nguyễn Văn A",
        "email": "admin@example.com"
      },
      "createdAt": "2025-09-14T10:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 25
}
```

```

### Sử dụng:
- Hiển thị danh sách quiz của user để quản lý
- Dashboard cá nhân với pagination
- Theo dõi số lượng quiz đã tạo

---

## 3. Lấy chi tiết quiz

**GET** `/api/quizzes/{quizId}`

Lấy thông tin chi tiết của một quiz bao gồm tất cả câu hỏi và lựa chọn.

### URL Parameters:
- `quizId` (string): ID của quiz cần lấy

### Response (200):
```json
{
  "_id": "67643aa4e123456789abcdef",
  "title": "English Vocabulary - Chapter 1",
  "sourceText": "Từ vựng tiếng Anh cơ bản cho người mới bắt đầu. Bao gồm các từ thường dùng trong giao tiếp hàng ngày.",
  "model": "gemini-1.5-flash",
  "questions": [
    {
      "prompt": "Từ 'beautiful' trong tiếng Việt có nghĩa là gì?",
      "choices": [
        {
          "text": "đẹp",
          "isCorrect": true
        },
        {
          "text": "xấu",
          "isCorrect": false
        },
        {
          "text": "to",
          "isCorrect": false
        },
        {
          "text": "nhỏ",
          "isCorrect": false
        }
      ],
      "explanation": "Beautiful /ˈbjuːtɪfəl/ có nghĩa là đẹp trong tiếng Việt"
    }
  ],
  "createdBy": {
    "_id": "67643bb4e123456789abcdef",
    "fullName": "Nguyễn Văn A",
    "email": "admin@example.com"
  },
  "createdAt": "2025-09-14T10:00:00.000Z",
  "updatedAt": "2025-09-14T10:00:00.000Z"
}
```

### Lỗi phổ biến:
- **404**: Quiz không tồn tại
- **401**: Chưa đăng nhập

### Sử dụng:
- Hiển thị quiz để user làm bài
- Lấy câu hỏi và đáp án để render UI
- Kiểm tra thông tin quiz trước khi submit

---

## 4. Cập nhật quiz

**PUT** `/api/quizzes/{quizId}`

⚠️ **Quyền hạn**: Chỉ **owner** hoặc **admin** mới có thể cập nhật.

Cập nhật thông tin quiz, câu hỏi và đáp án.

### URL Parameters:
- `quizId` (string): ID của quiz cần cập nhật

### Request Body:
```json
{
  "title": "English Vocabulary - Chapter 1 (Updated)"
}
```

### Parameters:
- `title` (string, optional): Tiêu đề quiz mới

⚠️ **Lưu ý**: Hiện tại chỉ hỗ trợ cập nhật title. Không thể cập nhật questions vì chúng được AI tạo tự động.

### Response (200):
```json
{
  "status": "success",
  "message": "Cập nhật quiz thành công",
  "data": {
    "_id": "67643aa4e123456789abcdef",
    "title": "English Vocabulary - Chapter 1 (Updated)",
    "sourceText": "Từ vựng tiếng Anh cơ bản...",
    "model": "gemini-1.5-flash",
    "questions": [...],
    "createdBy": {...},
    "updatedAt": "2025-09-14T15:30:00.000Z"
  }
}
```

### Lỗi phổ biến:
- **403**: Không có quyền cập nhật quiz
- **404**: Quiz không tồn tại
- **400**: Dữ liệu không hợp lệ

---

## 5. Xóa quiz

**DELETE** `/api/quizzes/{quizId}`

⚠️ **Quyền hạn**: Chỉ **owner** hoặc **admin** mới có thể xóa.

Xóa hoàn toàn quiz khỏi hệ thống.

### URL Parameters:
- `quizId` (string): ID của quiz cần xóa

### Response (200):
```json
{
  "status": "success",
  "message": "Xóa quiz thành công"
}
```

### Lỗi phổ biến:
- **403**: Không có quyền xóa quiz
- **404**: Quiz không tồn tại

### ⚠️ Lưu ý:
- Thao tác này không thể hoàn tác
- Tất cả submissions liên quan sẽ bị ảnh hưởng
- Nên backup dữ liệu trước khi xóa

---

## 6. Lấy quiz của tôi (Alternative Endpoint)

**GET** `/api/quizzes/my/quizzes?page=1&limit=10`

Endpoint thay thế để lấy danh sách quiz của user hiện tại.

### Query Parameters:
- `page` (number, optional): Trang hiện tại. Mặc định: 1
- `limit` (number, optional): Số quiz mỗi trang. Mặc định: 10

### Response (200):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "_id": "67643aa4e123456789abcdef",
        "title": "My Custom Quiz",
        "sourceText": "Văn bản nguồn do tôi cung cấp...",
        "model": "gemini-1.5-flash",
        "questions": [...],
        "createdBy": {...},
        "createdAt": "2025-09-14T10:00:00.000Z"
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 15
  }
}
```

### Sử dụng:
- Dashboard quản lý quiz cá nhân (alternative endpoint)
- Tương tự như endpoint `/api/quizzes` nhưng với response format khác
- Phù hợp cho UI cần format cụ thể

⚠️ **Lưu ý**: Cả hai endpoint `/api/quizzes` và `/api/quizzes/my/quizzes` đều trả về quiz của user hiện tại, chỉ khác response format.

---

# 🔄 Integration Examples

## Frontend Integration

### 1. Lấy và hiển thị danh sách quiz:
```javascript
// Fetch quiz list with filters
const fetchQuizzes = async (page = 1, category = '', search = '') => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '10',
    ...(category && { category }),
    ...(search && { search })
  });

  const response = await fetch(`/api/quizzes?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return data.metadata;
};

// Usage
const quizData = await fetchQuizzes(1, 'vocabulary', 'english');
console.log(`Found ${quizData.pagination.totalItems} quizzes`);
```

### 2. Tạo quiz mới (Admin):
```javascript
const createNewQuiz = async (quizData) => {
  const response = await fetch('/api/quizzes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(quizData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Usage
const newQuiz = {
  title: "Test Quiz",
  text: "Văn bản nguồn để AI tạo câu hỏi từ đây. Nội dung cần đủ dài và có thông tin để AI có thể tạo ra các câu hỏi chất lượng."
};

try {
  const result = await createNewQuiz(newQuiz);
  console.log('Quiz created:', result.metadata._id);
} catch (error) {
  console.error('Failed to create quiz:', error.message);
}
```

### 3. Lấy chi tiết quiz để làm bài:
```javascript
const getQuizForTaking = async (quizId) => {
  const response = await fetch(`/api/quizzes/${quizId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();
  return data.metadata;
};

// Prepare quiz for user interface
const quiz = await getQuizForTaking('67643aa4e123456789abcdef');
const questions = quiz.questions.map(q => ({
  prompt: q.prompt,
  choices: q.choices.map(c => ({
    text: c.text
    // Note: isCorrect is hidden for taking quiz
  })),
  explanation: q.explanation
}));
```

## Backend Integration

### 1. Middleware Usage:
```javascript
// routes/quizzes.routes.js
import { authenticate, requireRole, requireOwnerOrAdmin } from '../middlewares/auth.js';

// Admin only endpoints
router.post('/', authenticate, requireRole('admin'), createQuiz);

// Owner or Admin only
router.put('/:id', authenticate, requireOwnerOrAdmin(), updateQuiz);
router.delete('/:id', authenticate, requireOwnerOrAdmin(), deleteQuiz);

// Authenticated users
router.get('/', authenticate, listQuizzes);
router.get('/:id', authenticate, getQuizById);
```

### 2. Error Handling:
```javascript
// controllers/quizzes.controller.js
export const createQuiz = async (req, res, next) => {
  try {
    // Quiz creation logic với AI
    const { title, text, model } = req.body;
    const generated = await generateQuizFromText(text, model);
    const quiz = await Quiz.create({
      title,
      sourceText: text,
      model: generated.model,
      questions: generated.questions,
      createdBy: req.user._id
    });
    
    res.status(201).json(quiz);
  } catch (error) {
    // Sử dụng global error handler
    next(error);
  }
};
```

---

# 🎯 Best Practices

## 1. Security Guidelines:
- ✅ Luôn validate input data với Zod schema
- ✅ Kiểm tra ownership trước khi update/delete
- ✅ Rate limiting cho API tạo quiz
- ✅ Sanitize user input để tránh XSS

## 2. Performance Tips:
- ✅ Sử dụng pagination cho danh sách quiz
- ✅ Index MongoDB cho search và filter
- ✅ Cache danh sách quiz phổ biến
- ✅ Compress response data

## 3. User Experience:
- ✅ Provide meaningful error messages
- ✅ Support search và filter
- ✅ Show loading states
- ✅ Implement offline caching

## 4. Data Validation:
```javascript
const CreateQuizSchema = z.object({
  title: z.string().min(1, 'title không được để trống'),
  text: z.string().min(10, 'text quá ngắn, tối thiểu 10 ký tự'),
  model: z.string().optional()
});

const UpdateQuizSchema = z.object({
  title: z.string().min(1, 'title không được để trống').optional()
});
```

---

# 🔧 Environment Variables

Cần thiết lập các environment variables sau:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/quizrise

# JWT Authentication  
JWT_ACCESS_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# AI Service (Gemini)
GEMINI_API_KEY_1=your_primary_gemini_key
GEMINI_API_KEY_2=your_backup_gemini_key
# ... up to GEMINI_API_KEY_8

# Learning System
SKILL=A2-B1
```

---

# 📞 Support & Troubleshooting

## Common Issues:

### 1. **403 Forbidden khi tạo quiz:**
```json
{
  "success": false,
  "message": "Không có quyền truy cập"
}
```
**Solution**: Đảm bảo user có role 'admin' trong JWT token.

### 2. **404 Quiz not found:**
```json
{
  "success": false,
  "message": "Quiz không tồn tại"
}
```
**Solution**: Kiểm tra quiz ID có đúng format ObjectId không.

### 3. **400 Validation Error:**
```json
{
  "message": "text quá ngắn, tối thiểu 10 ký tự"
}
```
**Solution**: Kiểm tra request body theo đúng schema requirements.

### 4. **500 AI Service Error:**
```json
{
  "message": "AI service không khả dụng"
}
```
**Solution**: Kiểm tra Gemini API keys và network connection.

## Debug Tips:
1. Check JWT token expiration
2. Verify user permissions in database
3. Validate request body format
4. Check MongoDB connection
5. Review server logs cho detailed errors

Happy coding! 🚀