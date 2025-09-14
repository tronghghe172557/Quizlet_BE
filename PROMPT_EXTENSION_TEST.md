## Test Prompt Extension Feature

### 1. Test với Prompt mặc định (không có promptExtension)

```bash
POST /api/quizzes
{
  "title": "Test Default Prompt",
  "text": "hello\nworld\nbeautiful",
  "questionCount": 3,
  "questionType": "vocabulary",
  "choicesPerQuestion": 4,
  "vocabulary": "cơ bản",
  "englishLevel": "A2",
  "displayLanguage": "Tiếng Việt",
  "note": "Test quiz với prompt mặc định"
}
```

### 2. Test với Prompt tùy chỉnh (có promptExtension)

```bash
POST /api/quizzes
{
  "title": "Test Custom Prompt",
  "text": "hello\nworld\nbeautiful", 
  "questionCount": 3,
  "questionType": "vocabulary",
  "choicesPerQuestion": 4,
  "vocabulary": "cơ bản",
  "englishLevel": "A2",
  "displayLanguage": "Tiếng Việt",
  "note": "Test quiz với prompt tùy chỉnh",
  "promptExtension": "Bạn là một giáo viên tiếng Anh chuyên nghiệp. Hãy tạo câu hỏi trắc nghiệm về từ vựng với phong cách nghiêm túc và học thuật. Mỗi câu hỏi phải có 4 lựa chọn, trong đó chỉ có 1 đáp án đúng. Đưa ra giải thích chi tiết cho từng câu hỏi."
}
```

### 3. Kiểm tra kết quả

- **Prompt mặc định**: Sử dụng phong cách "Cô Trang" gần gũi, hài hước
- **Prompt tùy chỉnh**: Sử dụng phong cách nghiêm túc, học thuật như định nghĩa trong promptExtension

### 4. Validation

- promptExtension có thể để trống hoặc null
- Độ dài tối đa: 2000 ký tự
- Khi có promptExtension, nó sẽ thay thế hoàn toàn prompt mặc định
- Vẫn giữ nguyên format JSON output và quiz config