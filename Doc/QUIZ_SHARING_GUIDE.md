# 🤝 Quiz Sharing Feature - Hướng dẫn sử dụng

## 📖 Tổng quan

Tính năng **Quiz Sharing** cho phép Admin chia sẻ quiz với các users khác trong hệ thống. Sau khi được chia sẻ, users có thể xem và làm quiz mà không cần tự tạo.

## 🔐 Quy tắc phân quyền

### 👑 Admin
- ✅ Xem danh sách tất cả users trong hệ thống
- ✅ Chia sẻ bất kỳ quiz nào với bất kỳ user nào
- ✅ Hủy chia sẻ quiz với users
- ✅ Xem danh sách users đã được chia sẻ quiz
- ✅ Truy cập tất cả quiz (của mình + của người khác)

### 👤 User thường
- ❌ **KHÔNG** được xem danh sách users
- ❌ **KHÔNG** được chia sẻ quiz
- ❌ **KHÔNG** được hủy chia sẻ quiz
- ✅ Chỉ xem được quiz của mình + quiz được chia sẻ với mình

---

## 🚀 Workflow sử dụng

### Bước 1: Admin lấy danh sách Users
Trước khi chia sẻ quiz, Admin cần biết danh sách users để chọn.

### Bước 2: Admin chia sẻ Quiz
Chọn quiz và thêm danh sách users muốn chia sẻ.

### Bước 3: Users xem Quiz được chia sẻ
Users sẽ thấy quiz trong danh sách quiz của mình.

### Bước 4: (Tùy chọn) Admin hủy chia sẻ
Admin có thể hủy chia sẻ với một số users bất kỳ lúc nào.

---

# 📋 Chi tiết API

## 1. Lấy danh sách Users (Admin only)

**GET** `/api/auth/users`

### 🔒 Authentication
```
Authorization: Bearer <admin_access_token>
```

### 📝 Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Tìm kiếm theo tên hoặc email |
| `page` | integer | No | 1 | Số trang (min: 1) |
| `limit` | integer | No | 20 | Số users per page (max: 100) |

### 📋 Request Example
```bash
curl -X GET "http://localhost:3001/api/auth/users?search=john&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### ✅ Success Response (200)
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

### ❌ Error Responses
```json
// 403 - User không phải Admin
{
  "status": "error",
  "message": "Chỉ admin mới có quyền xem danh sách users"
}

// 401 - Chưa đăng nhập
{
  "status": "error", 
  "message": "Access token required"
}
```

---

## 2. Chia sẻ Quiz với Users

**POST** `/api/quizzes/:id/share`

### 🔒 Authentication
```
Authorization: Bearer <admin_access_token>
```

### 📝 Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Quiz ID cần chia sẻ |

### 📋 Request Body
```json
{
  "userIds": [
    "60d5ecb74b24a10004f1c8e1",
    "60d5ecb74b24a10004f1c8e2", 
    "60d5ecb74b24a10004f1c8e3"
  ]
}
```

### 📋 Request Example
```bash
curl -X POST "http://localhost:3001/api/quizzes/60d5ecb74b24a10004f1c8d1/share" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [
      "60d5ecb74b24a10004f1c8e1",
      "60d5ecb74b24a10004f1c8e2"
    ]
  }'
```

### ✅ Success Response (200)
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
        "60d5ecb74b24a10004f1c8e3"  // User đã được chia sẻ trước đó
      ],
      "createdBy": {
        "_id": "60d5ecb74b24a10004f1c8a1",
        "name": "Admin User",
        "email": "admin@example.com"
      }
    },
    "sharedWithCount": 3
  }
}
```

### ❌ Error Responses
```json
// 403 - User không phải Admin
{
  "status": "error",
  "message": "Chỉ admin mới có quyền chia sẻ quiz"
}

// 404 - Quiz không tồn tại
{
  "status": "error",
  "message": "Resource not found"
}

// 400 - Không có user hợp lệ
{
  "status": "error",
  "message": "Không có user hợp lệ nào để chia sẻ"
}

// 400 - Validation error
{
  "status": "error",
  "message": "Phải có ít nhất 1 user"
}
```

---

## 3. Hủy chia sẻ Quiz

**DELETE** `/api/quizzes/:id/share`

### 🔒 Authentication
```
Authorization: Bearer <admin_access_token>
```

### 📝 Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Quiz ID cần hủy chia sẻ |

### 📋 Request Body
```json
{
  "userIds": [
    "60d5ecb74b24a10004f1c8e1",
    "60d5ecb74b24a10004f1c8e3"
  ]
}
```

### 📋 Request Example
```bash
curl -X DELETE "http://localhost:3001/api/quizzes/60d5ecb74b24a10004f1c8d1/share" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [
      "60d5ecb74b24a10004f1c8e1"
    ]
  }'
```

### ✅ Success Response (200)
```json
{
  "status": "success",
  "message": "Đã hủy chia sẻ quiz với 1 user(s)",
  "data": {
    "quiz": {
      "_id": "60d5ecb74b24a10004f1c8d1",
      "title": "Từ vựng chủ đề gia đình",
      "sharedWith": [
        "60d5ecb74b24a10004f1c8e2"  // Chỉ còn 1 user
      ]
    },
    "sharedWithCount": 1
  }
}
```

---

## 4. Xem danh sách Users được chia sẻ Quiz

**GET** `/api/quizzes/:id/shared-users`

### 🔒 Authentication
```
Authorization: Bearer <admin_access_token>
```

### 📝 Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Quiz ID cần xem |

### 📋 Request Example
```bash
curl -X GET "http://localhost:3001/api/quizzes/60d5ecb74b24a10004f1c8d1/shared-users" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### ✅ Success Response (200)
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

## 5. Xem Quiz được chia sẻ (User)

**GET** `/api/quizzes/my/quizzes`

### 🔒 Authentication
```
Authorization: Bearer <user_access_token>
```

### 📝 Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | No | 'all' | Loại quiz: 'own', 'shared', 'all' |
| `page` | integer | No | 1 | Số trang |
| `limit` | integer | No | 10 | Số quiz per page |

### 📋 Request Examples
```bash
# Tất cả quiz (của mình + được chia sẻ)
curl -X GET "http://localhost:3001/api/quizzes/my/quizzes?type=all" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Chỉ quiz được chia sẻ với mình
curl -X GET "http://localhost:3001/api/quizzes/my/quizzes?type=shared" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Chỉ quiz của mình tạo
curl -X GET "http://localhost:3001/api/quizzes/my/quizzes?type=own" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### ✅ Success Response (200)
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
          "60d5ecb74b24a10004f1c8e1"  // User hiện tại
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

---

# 🎯 Use Cases thực tế

## Scenario 1: Admin chia sẻ quiz cho team

```bash
# 1. Admin tìm users trong team
GET /api/auth/users?search=developer&limit=20

# 2. Admin chia sẻ quiz "JavaScript Basics" với team
POST /api/quizzes/60d5ecb74b24a10004f1c8d1/share
{
  "userIds": ["dev1_id", "dev2_id", "dev3_id"]
}

# 3. Team members xem quiz được chia sẻ
GET /api/quizzes/my/quizzes?type=shared
```

## Scenario 2: Admin quản lý quyền truy cập

```bash
# 1. Xem ai đang có quyền truy cập quiz
GET /api/quizzes/60d5ecb74b24a10004f1c8d1/shared-users

# 2. Hủy quyền truy cập của 1 user cụ thể
DELETE /api/quizzes/60d5ecb74b24a10004f1c8d1/share
{
  "userIds": ["user_to_remove_id"]
}

# 3. Thêm user mới vào quiz
POST /api/quizzes/60d5ecb74b24a10004f1c8d1/share
{
  "userIds": ["new_user_id"]
}
```

## Scenario 3: User làm quiz được chia sẻ

```bash
# 1. User xem danh sách quiz của mình (bao gồm cả shared)
GET /api/quizzes/my/quizzes?type=all

# 2. User xem chi tiết quiz được chia sẻ
GET /api/quizzes/60d5ecb74b24a10004f1c8d1

# 3. User làm quiz và nộp bài
POST /api/submissions
{
  "quiz": "60d5ecb74b24a10004f1c8d1",
  "answers": [...]
}
```

---

# 🔧 Technical Implementation

## Database Changes

### Quiz Model
```javascript
const QuizSchema = new mongoose.Schema({
  // ... existing fields
  sharedWith: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],  // 🆕 New field
});
```

## Permission Logic

### validateQuizAccess()
```javascript
export const validateQuizAccess = (quiz, req) => {
  // Admin luôn có quyền
  if (req.user.role === 'admin') return true;
  
  // Owner có quyền
  if (quiz.createdBy.toString() === req.user._id.toString()) return true;
  
  // User được chia sẻ có quyền
  if (quiz.sharedWith?.includes(req.user._id)) return true;
  
  return false;
};
```

## Route Protection

```javascript
// Chỉ admin mới được chia sẻ
router.post('/:id/share', authenticate, validateResourceOwnership(Quiz), asyncHandler(shareQuiz));

// User có thể xem quiz được chia sẻ
router.get('/:id', authenticate, asyncHandler(getQuizById)); // Kiểm tra trong controller
```

---

# ❓ FAQ

## Q: User có thể chia sẻ quiz của mình không?
**A:** Không. Chỉ Admin mới có quyền chia sẻ quiz. Đây là quy tắc business logic để kiểm soát việc phân phối nội dung.

## Q: User có thể xem quiz được chia sẻ với người khác không?
**A:** Không. User chỉ xem được quiz của mình tạo + quiz được chia sẻ **với mình**.

## Q: Admin có thể chia sẻ quiz của user khác không?
**A:** Có. Admin có toàn quyền với tất cả quiz trong hệ thống.

## Q: Có giới hạn số lượng users được chia sẻ không?
**A:** Không có giới hạn cứng trong code, nhưng nên cân nhắc performance khi chia sẻ với quá nhiều users.

## Q: User được chia sẻ có thể chỉnh sửa quiz không?
**A:** Không. User được chia sẻ chỉ có quyền **xem** và **làm** quiz, không được chỉnh sửa.

## Q: Khi xóa user thì quiz sharing có bị ảnh hưởng không?
**A:** Cần implement logic cleanup khi user bị xóa để remove khỏi danh sách `sharedWith`.

---

# 🚀 Next Steps

## Tính năng có thể mở rộng:
- **Real-time notifications** khi được chia sẻ quiz mới
- **Bulk sharing** với groups/roles
- **Permission levels** (view-only, take-quiz, etc.)
- **Sharing history** tracking
- **Expiry dates** cho shared access
- **Password protection** cho sensitive quiz

---

**📅 Created:** September 2025  
**👨‍💻 Developer:** Quizrise Team  
**📧 Support:** Contact through GitHub Issues