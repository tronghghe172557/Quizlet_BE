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

## 7. Cập nhật câu hỏi cụ thể trong quiz

**PUT** `/api/quizzes/{quizId}/questions/{questionIndex}`

⚠️ **Quyền hạn**: Chỉ **owner** hoặc **admin** mới có thể cập nhật.

Cập nhật một câu hỏi cụ thể trong quiz theo chỉ số.

### URL Parameters:
- `quizId` (string): ID của quiz cần cập nhật
- `questionIndex` (number): Chỉ số của câu hỏi cần cập nhật (bắt đầu từ 0)

### Request Body:
```json
{
  "prompt": "Từ mới: take a picture\nĐịnh nghĩa (EN): To use a camera to record a person, scene, etc.\nTừ loại: Verb phrase\nNghĩa tiếng Việt: chụp ảnh\nMẹo ghi nhớ: Tưởng tượng đang 'take' (cầm) cái 'picture' (ảnh) lên để chụp. 'Take a picture' giống như 'tóm lấy khoảnh khắc' vậy đó!\nPhát âm (IPA): /teɪk ə ˈpɪktʃər/",
  "explanation": "Hội thoại/Ví dụ thực tế: A: 'Chị ơi, 'take a picture' cho em với, em muốn có ảnh sống ảo!' B: 'Ok em, tạo dáng đi, chị 'take' cho mấy kiểu!'",
  "choices": [
    {
      "text": "vẽ tranh",
      "isCorrect": false
    },
    {
      "text": "tô màu", 
      "isCorrect": false
    },
    {
      "text": "chụp ảnh",
      "isCorrect": true
    },
    {
      "text": "xem tranh",
      "isCorrect": false
    }
  ]
}
```

### Parameters:
- `prompt` (string, optional): Nội dung câu hỏi mới
- `explanation` (string, optional): Giải thích cho câu hỏi
- `choices` (array, optional): Danh sách lựa chọn mới (tối thiểu 2 lựa chọn, phải có ít nhất 1 đáp án đúng)

### Response (200):
```json
{
  "status": "success",
  "message": "Cập nhật câu hỏi thành công",
  "data": {
    "question": {
      "prompt": "Từ mới: take a picture\nĐịnh nghĩa (EN): To use a camera to record a person, scene, etc.\nTừ loại: Verb phrase\nNghĩa tiếng Việt: chụp ảnh\nMẹo ghi nhớ: Tưởng tượng đang 'take' (cầm) cái 'picture' (ảnh) lên để chụp. 'Take a picture' giống như 'tóm lấy khoảnh khắc' vậy đó!\nPhát âm (IPA): /teɪk ə ˈpɪktʃər/",
      "choices": [
        {
          "text": "vẽ tranh",
          "isCorrect": false
        },
        {
          "text": "tô màu",
          "isCorrect": false
        },
        {
          "text": "chụp ảnh", 
          "isCorrect": true
        },
        {
          "text": "xem tranh",
          "isCorrect": false
        }
      ],
      "explanation": "Hội thoại/Ví dụ thực tế: A: 'Chị ơi, 'take a picture' cho em với, em muốn có ảnh sống ảo!' B: 'Ok em, tạo dáng đi, chị 'take' cho mấy kiểu!'"
    },
    "questionIndex": 0
  }
}
```

### Lỗi phổ biến:
- **403**: Không có quyền cập nhật quiz
- **404**: Quiz không tồn tại
- **400**: Chỉ số câu hỏi không hợp lệ hoặc dữ liệu không hợp lệ
- **400**: Không có đáp án đúng nào trong choices

### Sử dụng:
- Chỉnh sửa nội dung câu hỏi cụ thể
- Cập nhật đáp án và lựa chọn
- Thêm hoặc sửa giải thích cho câu hỏi

---

# 🤝 Quiz Sharing APIs

## 8. Lấy danh sách Users (Admin Only)

**GET** `/api/auth/users`

⚠️ **Quyền hạn**: Chỉ **Admin** mới có thể truy cập.

Lấy danh sách tất cả users trong hệ thống để chọn chia sẻ quiz.

### Query Parameters:
- `search` (string, optional): Tìm kiếm theo tên hoặc email
- `page` (number, optional): Số trang. Mặc định: 1
- `limit` (number, optional): Số users per page. Mặc định: 20, tối đa: 100

### Request Example:
```bash
curl -X GET "http://localhost:3001/api/auth/users?search=john&page=1&limit=10" \
  -H "Authorization: Bearer <admin_access_token>"
```

### Response (200):
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "_id": "60d5ecb74b24a10004f1c8e1",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user"
      },
      {
        "_id": "60d5ecb74b24a10004f1c8e2",
        "name": "Jane Smith", 
        "email": "jane@example.com",
        "role": "user"
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

### Lỗi phổ biến:
- **403**: User không phải Admin
- **401**: Chưa đăng nhập

---

## 9. Chia sẻ Quiz với Users

**POST** `/api/quizzes/{quizId}/share`

⚠️ **Quyền hạn**: Chỉ **Admin** mới có thể chia sẻ quiz.

Thêm users vào danh sách được chia sẻ quiz.

### URL Parameters:
- `quizId` (string): ID của quiz cần chia sẻ

### Request Body:
```json
{
  "userIds": [
    "60d5ecb74b24a10004f1c8e1",
    "60d5ecb74b24a10004f1c8e2",
    "60d5ecb74b24a10004f1c8e3"
  ]
}
```

### Request Example:
```bash
curl -X POST "http://localhost:3001/api/quizzes/60d5ecb74b24a10004f1c8d1/share" \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [
      "60d5ecb74b24a10004f1c8e1",
      "60d5ecb74b24a10004f1c8e2"
    ]
  }'
```

### Response (200):
```json
{
  "status": "success",
  "message": "Đã chia sẻ quiz với 2 user(s)",
  "data": {
    "quiz": {
      "_id": "60d5ecb74b24a10004f1c8d1",
      "title": "Từ vựng chủ đề gia đình",
      "sharedWith": [
        "60d5ecb74b24a10004f1c8e1",
        "60d5ecb74b24a10004f1c8e2",
        "60d5ecb74b24a10004f1c8e3"
      ]
    },
    "sharedWithCount": 3
  }
}
```

### Lỗi phổ biến:
- **403**: User không phải Admin
- **404**: Quiz không tồn tại
- **400**: Không có user hợp lệ để chia sẻ

---

## 10. Hủy chia sẻ Quiz

**DELETE** `/api/quizzes/{quizId}/share`

⚠️ **Quyền hạn**: Chỉ **Admin** mới có thể hủy chia sẻ.

Loại bỏ users khỏi danh sách được chia sẻ quiz.

### URL Parameters:
- `quizId` (string): ID của quiz cần hủy chia sẻ

### Request Body:
```json
{
  "userIds": [
    "60d5ecb74b24a10004f1c8e1",
    "60d5ecb74b24a10004f1c8e3"
  ]
}
```

### Response (200):
```json
{
  "status": "success",
  "message": "Đã hủy chia sẻ quiz với 2 user(s)",
  "data": {
    "quiz": {
      "_id": "60d5ecb74b24a10004f1c8d1",
      "title": "Từ vựng chủ đề gia đình",
      "sharedWith": [
        "60d5ecb74b24a10004f1c8e2"
      ]
    },
    "sharedWithCount": 1
  }
}
```

---

## 11. Xem Users được chia sẻ Quiz

**GET** `/api/quizzes/{quizId}/shared-users`

⚠️ **Quyền hạn**: Chỉ **owner** hoặc **admin** mới có thể xem.

Lấy danh sách users đã được chia sẻ quiz.

### URL Parameters:
- `quizId` (string): ID của quiz cần xem

### Response (200):
```json
{
  "status": "success",
  "data": {
    "sharedUsers": [
      {
        "_id": "60d5ecb74b24a10004f1c8e1",
        "name": "John Doe",
        "email": "john@example.com"
      },
      {
        "_id": "60d5ecb74b24a10004f1c8e2",
        "name": "Jane Smith",
        "email": "jane@example.com" 
      }
    ]
  }
}
```

---

## 12. Lấy Quiz theo loại (Own/Shared/All)

**GET** `/api/quizzes/my/quizzes?type=shared`

Lấy quiz theo loại cụ thể với query parameter `type`.

### Query Parameters:
- `type` (string, optional): Loại quiz. Giá trị: 'own', 'shared', 'all'. Mặc định: 'all'
- `page` (number, optional): Số trang. Mặc định: 1
- `limit` (number, optional): Số quiz per page. Mặc định: 10

### Request Examples:
```bash
# Tất cả quiz (của mình + được chia sẻ)
GET /api/quizzes/my/quizzes?type=all

# Chỉ quiz được chia sẻ với mình  
GET /api/quizzes/my/quizzes?type=shared

# Chỉ quiz của mình tạo
GET /api/quizzes/my/quizzes?type=own
```

### Response (200):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "_id": "60d5ecb74b24a10004f1c8d1",
        "title": "Từ vựng chủ đề gia đình",
        "createdBy": {
          "_id": "60d5ecb74b24a10004f1c8a1",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "sharedWith": [
          "60d5ecb74b24a10004f1c8e1"
        ],
        "createdAt": "2023-06-25T10:30:00.000Z"
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 5,
    "type": "shared"
  }
}
```

### Sử dụng:
- Dashboard hiển thị quiz theo loại
- Filter quiz own vs shared
- Quản lý quyền truy cập quiz

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

### 4. Cập nhật câu hỏi cụ thể (Owner/Admin):
```javascript
const updateQuizQuestion = async (quizId, questionIndex, questionData) => {
  const response = await fetch(`/api/quizzes/${quizId}/questions/${questionIndex}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(questionData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Usage
const questionData = {
  prompt: "Từ mới: take a picture\nNghĩa: chụp ảnh",
  explanation: "Ví dụ: Can you take a picture of me?",
  choices: [
    { text: "vẽ tranh", isCorrect: false },
    { text: "chụp ảnh", isCorrect: true },
    { text: "tô màu", isCorrect: false },
    { text: "xem tranh", isCorrect: false }
  ]
};

try {
  const result = await updateQuizQuestion('67643aa4e123456789abcdef', 0, questionData);
  console.log('Question updated:', result.data.question);
} catch (error) {
  console.error('Failed to update question:', error.message);
}
```

### 5. Quiz Sharing (Admin Only):
```javascript
// Lấy danh sách users để chia sẻ
const getUsers = async (search = '', page = 1) => {
  const params = new URLSearchParams({
    search,
    page: page.toString(),
    limit: '20'
  });

  const response = await fetch(`/api/auth/users?${params}`, {
    headers: {
      'Authorization': `Bearer ${adminAccessToken}`
    }
  });

  return response.json();
};

// Chia sẻ quiz với users
const shareQuiz = async (quizId, userIds) => {
  const response = await fetch(`/api/quizzes/${quizId}/share`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userIds })
  });

  return response.json();
};

// Usage
const users = await getUsers('john', 1);
const userIds = users.data.users.map(user => user._id);
const shareResult = await shareQuiz('67643aa4e123456789abcdef', userIds);
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
router.put('/:id/questions/:questionIndex', authenticate, validateResourceOwnership(Quiz), updateQuizQuestion);
router.delete('/:id', authenticate, requireOwnerOrAdmin(), deleteQuiz);

// Admin only sharing
router.post('/:id/share', authenticate, validateResourceOwnership(Quiz), shareQuiz);
router.delete('/:id/share', authenticate, validateResourceOwnership(Quiz), unshareQuiz);

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

export const updateQuizQuestion = async (req, res, next) => {
  try {
    const quiz = req.resource;
    const questionIndex = parseInt(req.params.questionIndex);
    
    // Validation và update logic
    const updateData = UpdateQuestionSchema.parse(req.body);
    
    if (updateData.choices) {
      const hasCorrectAnswer = updateData.choices.some(choice => choice.isCorrect);
      if (!hasCorrectAnswer) {
        return res.status(400).json({
          status: 'error',
          message: 'Phải có ít nhất 1 đáp án đúng'
        });
      }
    }
    
    // Update question
    quiz.questions[questionIndex] = { ...quiz.questions[questionIndex], ...updateData };
    await quiz.save();
    
    res.json({
      status: 'success',
      message: 'Cập nhật câu hỏi thành công',
      data: { question: quiz.questions[questionIndex], questionIndex }
    });
  } catch (error) {
    next(error);
  }
};
```

### 3. Quiz Sharing Permission Logic:
```javascript
// helpers/permissions.js
export const validateQuizAccess = (quiz, req) => {
  // Admin luôn có quyền
  if (req.user.role === 'admin') return true;
  
  // Owner có quyền
  if (quiz.createdBy.toString() === req.user._id.toString()) return true;
  
  // User được chia sẻ có quyền
  if (quiz.sharedWith?.includes(req.user._id)) return true;
  
  return false;
};

// controllers/quizzes.controller.js
export const shareQuiz = async (req, res, next) => {
  try {
    // Chỉ admin mới được chia sẻ
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Chỉ admin mới có quyền chia sẻ quiz'
      });
    }

    const { userIds } = req.body;
    const quiz = req.resource;
    
    // Add users to sharedWith array (no duplicates)
    const currentSharedWith = quiz.sharedWith || [];
    const newSharedWith = [...new Set([
      ...currentSharedWith.map(id => id.toString()),
      ...userIds
    ])].map(id => new mongoose.Types.ObjectId(id));
    
    quiz.sharedWith = newSharedWith;
    await quiz.save();
    
    res.json({
      status: 'success',
      message: `Đã chia sẻ quiz với ${userIds.length} user(s)`,
      data: { quiz, sharedWithCount: quiz.sharedWith.length }
    });
  } catch (error) {
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

const UpdateQuestionSchema = z.object({
  prompt: z.string().min(1, 'Câu hỏi không được để trống').optional(),
  explanation: z.string().optional(),
  choices: z.array(z.object({
    text: z.string().min(1, 'Lựa chọn không được để trống'),
    isCorrect: z.boolean()
  })).min(2, 'Phải có ít nhất 2 lựa chọn').optional()
});

const ShareQuizSchema = z.object({
  userIds: z.array(z.string().min(1, 'User ID không hợp lệ')).min(1, 'Phải có ít nhất 1 user')
});
```

## 5. Quiz Sharing Workflow:
```javascript
// Step 1: Admin gets list of users
const users = await fetch('/api/auth/users?search=john', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

// Step 2: Admin shares quiz with selected users
const shareResult = await fetch('/api/quizzes/123/share', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    userIds: ['user1_id', 'user2_id']
  })
});

// Step 3: Users can see shared quizzes
const userQuizzes = await fetch('/api/quizzes/my/quizzes?type=shared', {
  headers: { 'Authorization': `Bearer ${userToken}` }
});

// Step 4: Admin can unshare if needed
const unshareResult = await fetch('/api/quizzes/123/share', {
  method: 'DELETE',
  headers: { 
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    userIds: ['user1_id']
  })
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

### 5. **400 Question Index Invalid:**
```json
{
  "status": "error",
  "message": "Chỉ số câu hỏi không hợp lệ"
}
```
**Solution**: Kiểm tra questionIndex có nằm trong range 0 đến questions.length-1.

### 6. **400 No Correct Answer:**
```json
{
  "status": "error", 
  "message": "Phải có ít nhất 1 đáp án đúng"
}
```
**Solution**: Đảm bảo có ít nhất 1 choice với isCorrect: true.

### 7. **403 Quiz Sharing Permission:**
```json
{
  "status": "error",
  "message": "Chỉ admin mới có quyền chia sẻ quiz"
}
```
**Solution**: Đảm bảo user có role 'admin' để sử dụng sharing features.

## Debug Tips:
1. Check JWT token expiration
2. Verify user permissions in database  
3. Validate request body format
4. Check MongoDB connection
5. Review server logs cho detailed errors
6. **Quiz Sharing**: Kiểm tra role admin trước khi chia sẻ
7. **Question Update**: Validate questionIndex và choices array
8. **Shared Access**: Kiểm tra user có trong sharedWith array không

Happy coding! 🚀