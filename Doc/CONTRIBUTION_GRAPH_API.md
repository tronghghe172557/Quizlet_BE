# 📊 Contribution Graph API Documentation

## Tổng quan
API Contribution Graph cho phép tạo bảng hoạt động học tập giống GitHub, bao gồm:
- **Contribution Graph**: Dữ liệu hoạt động theo ngày với intensity levels
- **Streak System**: Tính chuỗi ngày học liên tiếp để gamification  
- **Learning Analytics**: Thống kê chi tiết về pattern học tập

---

## 🎯 API Endpoints

### 1. GET `/api/submissions/contributions/graph`
**Lấy dữ liệu contribution graph giống GitHub**

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `year` | Integer | Current year | Năm cần lấy dữ liệu |
| `days` | Integer | 365 | Số ngày lùi về từ endDate |
| `endDate` | String | Today | Ngày kết thúc (YYYY-MM-DD) |

#### Request Example
```bash
GET /api/submissions/contributions/graph?year=2025&days=365
Authorization: Bearer {jwt_token}
```

#### Response Format
```json
{
  "message": "Lấy contribution graph thành công",
  "data": {
    "contributions": [
      {
        "date": "2025-09-14",
        "count": 3,
        "intensity": 2,
        "averageScore": 85.5,
        "bestScore": 95,
        "totalTime": 1800,
        "weekday": 6,
        "week": 36
      }
    ],
    "stats": {
      "totalContributions": 127,
      "activeDays": 89,
      "totalDays": 365,
      "maxDayCount": 8,
      "averagePerDay": 1.4,
      "period": {
        "startDate": "2024-09-15",
        "endDate": "2025-09-14",
        "days": 365
      }
    }
  }
}
```

#### Response Fields
- **contributions[]**: Mảng dữ liệu từng ngày
  - `date`: Ngày (YYYY-MM-DD)
  - `count`: Số submission trong ngày
  - `intensity`: Mức độ hoạt động (0-4) để tô màu
  - `averageScore`: Điểm trung bình trong ngày
  - `bestScore`: Điểm cao nhất trong ngày
  - `totalTime`: Tổng thời gian học (giây)
  - `weekday`: Thứ trong tuần (0=CN, 1=T2, ..., 6=T7)
  - `week`: Tuần thứ mấy trong period

- **stats**: Thống kê tổng quan
  - `totalContributions`: Tổng số submission
  - `activeDays`: Số ngày có hoạt động
  - `maxDayCount`: Ngày có nhiều submission nhất
  - `averagePerDay`: Trung bình submission/ngày

---

### 2. GET `/api/submissions/contributions/streaks`
**Lấy thông tin streak (chuỗi ngày học liên tiếp)**

#### Request Example
```bash
GET /api/submissions/contributions/streaks
Authorization: Bearer {jwt_token}
```

#### Response Format
```json
{
  "message": "Lấy streak information thành công",
  "data": {
    "currentStreak": 5,
    "longestStreak": 12,
    "totalActiveDays": 89,
    "firstActivityDate": "2024-03-15",
    "lastActivityDate": "2025-09-14",
    "isActiveToday": true,
    "streakInfo": {
      "message": "Bạn đã học liên tục 5 ngày! 🔥",
      "motivation": "Kỷ lục của bạn là 12 ngày. Hãy cố gắng phá vỡ nó!"
    }
  }
}
```

#### Response Fields
- `currentStreak`: Chuỗi ngày học liên tiếp hiện tại
- `longestStreak`: Kỷ lục cá nhân (chuỗi dài nhất từng đạt được)
- `totalActiveDays`: Tổng số ngày đã có hoạt động học tập
- `firstActivityDate`: Ngày đầu tiên có hoạt động
- `lastActivityDate`: Ngày gần nhất có hoạt động  
- `isActiveToday`: Có học hôm nay không
- `streakInfo`: Tin nhắn động lực và gợi ý

---

### 3. GET `/api/submissions/contributions/summary`
**Lấy tổng quan thống kê contributions theo năm**

#### Request Example
```bash
GET /api/submissions/contributions/summary
Authorization: Bearer {jwt_token}
```

#### Response Format
```json
{
  "message": "Lấy contribution summary thành công",
  "data": {
    "year": 2025,
    "overview": {
      "totalSubmissions": 127,
      "averageScore": 82.3,
      "bestScore": 100,
      "totalTime": 45600,
      "totalTimeHours": 12.7,
      "activeDays": 89,
      "averagePerActiveDay": 1.4,
      "completionRate": 24
    },
    "monthlyBreakdown": [
      {
        "month": 9,
        "year": 2025,
        "count": 15,
        "averageScore": 85.2
      }
    ],
    "weekdayPattern": [
      {
        "dayOfWeek": 2,
        "dayName": "Thứ 2",
        "count": 20,
        "averageScore": 84.5
      }
    ],
    "insights": {
      "mostActiveMonth": 9,
      "bestMonthScore": 88.7,
      "mostActiveWeekday": "Thứ 2"
    }
  }
}
```

#### Response Fields

**overview**: Thống kê tổng quan năm
- `totalSubmissions`: Tổng số lần làm bài
- `averageScore`: Điểm trung bình cả năm
- `bestScore`: Điểm cao nhất từng đạt được
- `totalTime`: Tổng thời gian học (giây)
- `totalTimeHours`: Tổng thời gian học (giờ)
- `activeDays`: Số ngày có hoạt động
- `averagePerActiveDay`: Trung bình số bài/ngày có hoạt động
- `completionRate`: Tỷ lệ hoàn thành (activeDays/365 * 100)

**monthlyBreakdown[]**: Thống kê theo tháng
- `month`: Tháng (1-12)
- `year`: Năm
- `count`: Số submission trong tháng
- `averageScore`: Điểm trung bình tháng

**weekdayPattern[]**: Thống kê theo ngày trong tuần
- `dayOfWeek`: Ngày trong tuần (1=CN, 2=T2, ..., 7=T7)
- `dayName`: Tên ngày tiếng Việt
- `count`: Số submission trong ngày đó
- `averageScore`: Điểm trung bình ngày đó

**insights**: Phân tích thông minh
- `mostActiveMonth`: Tháng hoạt động nhiều nhất
- `bestMonthScore`: Điểm trung bình cao nhất theo tháng
- `mostActiveWeekday`: Ngày trong tuần học nhiều nhất

---

## 🎨 Frontend Implementation Guide

### Contribution Graph (GitHub-style)
```javascript
// Lấy dữ liệu cho contribution graph
async function fetchContributionGraph(days = 365) {
  const response = await fetch(`/api/submissions/contributions/graph?days=${days}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const { data } = await response.json();
  return data;
}

// Render contribution squares
function renderContributionGraph(contributions) {
  contributions.forEach(day => {
    const square = document.createElement('div');
    square.className = `contribution-square intensity-${day.intensity}`;
    square.title = `${day.date}: ${day.count} contributions`;
    // Intensity 0-4 tương ứng với các màu khác nhau
  });
}
```

### Streak Display
```javascript
// Hiển thị streak info
async function showStreakInfo() {
  const response = await fetch('/api/submissions/contributions/streaks', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { data } = await response.json();
  
  document.getElementById('current-streak').textContent = `🔥 ${data.currentStreak} ngày`;
  document.getElementById('longest-streak').textContent = `🏆 Kỷ lục: ${data.longestStreak} ngày`;
  document.getElementById('motivation').textContent = data.streakInfo.motivation;
}
```

### Learning Analytics Dashboard
```javascript
// Tạo dashboard analytics
async function createAnalyticsDashboard() {
  const response = await fetch('/api/submissions/contributions/summary', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { data } = await response.json();
  
  // Render charts cho monthly breakdown và weekday pattern
  renderMonthlyChart(data.monthlyBreakdown);
  renderWeekdayChart(data.weekdayPattern);
  
  // Hiển thị insights
  showInsights(data.insights);
}
```

---

## 🔐 Authentication
Tất cả endpoints yêu cầu JWT token trong header:
```
Authorization: Bearer {your_jwt_token}
```

## 📱 Responsive Data
- Dữ liệu được tối ưu cho cả mobile và desktop
- Hỗ trợ pagination để tránh quá tải
- Caching friendly với date-based keys

## 🎯 Use Cases
1. **Personal Learning Dashboard**: Hiển thị progress cá nhân
2. **Gamification**: Streak system để tăng engagement
3. **Learning Analytics**: Phân tích pattern học tập
4. **Goal Tracking**: Theo dõi mục tiêu học tập hàng ngày
5. **Motivation System**: Động lực qua visualization và achievements