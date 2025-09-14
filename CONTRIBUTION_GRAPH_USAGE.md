# 📚 Quizrise API - Contribution Graph & Learning Analytics

## 🎯 Mục đích
Hệ thống APIs cho contribution graph giống GitHub, giúp visualize và gamify quá trình học từ vựng tiếng Anh.

## 🚀 Quick Start

### 1. Import Postman Collection
```bash
# Import file vào Postman
/postman/contribution_graph_api.json
```

### 2. Setup Environment
```javascript
// Trong Postman, tạo environment với:
baseUrl: http://localhost:3001
authToken: {{jwt_token_from_login}}
```

### 3. Authentication Flow
```bash
# 1. Login để lấy token
POST /api/auth/login
{
  "email": "user@example.com", 
  "password": "password123"
}

# 2. Copy token vào environment variable 'authToken'
# 3. Sử dụng các contribution APIs
```

---

## 📊 API Overview

| Endpoint | Method | Purpose | Response Size |
|----------|--------|---------|---------------|
| `/contributions/graph` | GET | GitHub-style contribution data | ~100KB (365 days) |
| `/contributions/streaks` | GET | Learning streaks & motivation | ~1KB |
| `/contributions/summary` | GET | Yearly analytics & insights | ~5KB |

---

## 🎨 Frontend Integration Examples

### React Component - Contribution Graph
```jsx
import React, { useState, useEffect } from 'react';

function ContributionGraph() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchContributionData();
  }, []);
  
  const fetchContributionData = async () => {
    const response = await fetch('/api/submissions/contributions/graph?days=365', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const result = await response.json();
    setData(result.data);
  };
  
  if (!data) return <div>Loading...</div>;
  
  return (
    <div className="contribution-graph">
      <h3>📈 Hoạt động học tập ({data.stats.totalContributions} contributions)</h3>
      <div className="graph-container">
        {data.contributions.map((day, index) => (
          <div 
            key={day.date}
            className={`contribution-day intensity-${day.intensity}`}
            title={`${day.date}: ${day.count} bài làm${day.averageScore > 0 ? `, điểm TB: ${day.averageScore}` : ''}`}
            style={{
              backgroundColor: getIntensityColor(day.intensity),
              gridColumn: day.week + 1,
              gridRow: day.weekday + 1
            }}
          />
        ))}
      </div>
      <div className="graph-legend">
        <span>Ít</span>
        {[0,1,2,3,4].map(i => (
          <div key={i} className={`legend-square intensity-${i}`} />
        ))}
        <span>Nhiều</span>
      </div>
    </div>
  );
}

function getIntensityColor(intensity) {
  const colors = {
    0: '#ebedf0',  // No activity - light gray
    1: '#9be9a8',  // Low activity - light green
    2: '#40c463',  // Medium-low - medium green  
    3: '#30a14e',  // Medium-high - dark green
    4: '#216e39'   // High activity - darkest green
  };
  return colors[intensity] || colors[0];
}

export default ContributionGraph;
```

### Vue.js Component - Streak Display
```vue
<template>
  <div class="streak-display">
    <div class="current-streak">
      <h2>🔥 {{ streakData?.currentStreak || 0 }}</h2>
      <p>Ngày liên tiếp</p>
    </div>
    
    <div class="streak-info">
      <div class="longest-streak">
        <span>🏆 Kỷ lục: {{ streakData?.longestStreak || 0 }} ngày</span>
      </div>
      
      <div class="motivation">
        <p>{{ streakData?.streakInfo?.message }}</p>
        <small>{{ streakData?.streakInfo?.motivation }}</small>
      </div>
      
      <div class="activity-status">
        <span :class="{ 'active': streakData?.isActiveToday }">
          {{ streakData?.isActiveToday ? '✅ Đã học hôm nay' : '⏰ Chưa học hôm nay' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StreakDisplay',
  data() {
    return {
      streakData: null
    }
  },
  async mounted() {
    await this.fetchStreakData();
  },
  methods: {
    async fetchStreakData() {
      try {
        const response = await fetch('/api/submissions/contributions/streaks', {
          headers: {
            'Authorization': `Bearer ${this.$store.state.auth.token}`
          }
        });
        const result = await response.json();
        this.streakData = result.data;
      } catch (error) {
        console.error('Error fetching streak data:', error);
      }
    }
  }
}
</script>
```

### JavaScript - Analytics Dashboard
```javascript
class LearningAnalytics {
  constructor(containerId, token) {
    this.container = document.getElementById(containerId);
    this.token = token;
    this.init();
  }
  
  async init() {
    const summaryData = await this.fetchSummary();
    this.renderOverview(summaryData.overview);
    this.renderMonthlyChart(summaryData.monthlyBreakdown);
    this.renderWeekdayChart(summaryData.weekdayPattern);
    this.renderInsights(summaryData.insights);
  }
  
  async fetchSummary() {
    const response = await fetch('/api/submissions/contributions/summary', {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    const result = await response.json();
    return result.data;
  }
  
  renderOverview(overview) {
    const overviewHtml = `
      <div class="overview-stats">
        <div class="stat-card">
          <h3>${overview.totalSubmissions}</h3>
          <p>Tổng bài làm</p>
        </div>
        <div class="stat-card">
          <h3>${overview.averageScore}%</h3>
          <p>Điểm TB</p>
        </div>
        <div class="stat-card">
          <h3>${overview.activeDays}</h3>
          <p>Ngày có hoạt động</p>
        </div>
        <div class="stat-card">
          <h3>${overview.totalTimeHours}h</h3>
          <p>Tổng thời gian</p>
        </div>
      </div>
    `;
    
    const overviewContainer = document.createElement('div');
    overviewContainer.innerHTML = overviewHtml;
    this.container.appendChild(overviewContainer);
  }
  
  renderMonthlyChart(monthlyData) {
    // Implementation với Chart.js hoặc D3.js
    const chartData = {
      labels: monthlyData.map(m => `Tháng ${m.month}`),
      datasets: [{
        label: 'Số bài làm',
        data: monthlyData.map(m => m.count),
        backgroundColor: '#40c463'
      }]
    };
    
    // Render chart với library yêu thích
    console.log('Monthly chart data:', chartData);
  }
  
  renderWeekdayChart(weekdayData) {
    // Pie chart hoặc bar chart cho weekday pattern
    const chartData = {
      labels: weekdayData.map(w => w.dayName),
      datasets: [{
        label: 'Hoạt động theo ngày',
        data: weekdayData.map(w => w.count),
        backgroundColor: [
          '#ff6384', '#36a2eb', '#cc65fe', 
          '#ffce56', '#ff9f40', '#ff6384', '#c9cbcf'
        ]
      }]
    };
    
    console.log('Weekday chart data:', chartData);
  }
  
  renderInsights(insights) {
    const insightsHtml = `
      <div class="insights">
        <h3>🔍 Thông tin thú vị</h3>
        <ul>
          <li>📅 Tháng hoạt động nhất: <strong>Tháng ${insights.mostActiveMonth}</strong></li>
          <li>⭐ Điểm cao nhất theo tháng: <strong>${insights.bestMonthScore}%</strong></li>
          <li>📆 Ngày học nhiều nhất: <strong>${insights.mostActiveWeekday}</strong></li>
        </ul>
      </div>
    `;
    
    const insightsContainer = document.createElement('div');
    insightsContainer.innerHTML = insightsHtml;
    this.container.appendChild(insightsContainer);
  }
}

// Usage
const analytics = new LearningAnalytics('analytics-container', userToken);
```

---

## 🎨 CSS Styling Guide

### Contribution Graph Styles
```css
.contribution-graph {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.graph-container {
  display: grid;
  grid-template-columns: repeat(53, 1fr); /* 52 tuần + 1 */
  grid-template-rows: repeat(7, 1fr);     /* 7 ngày trong tuần */
  gap: 2px;
  margin: 20px 0;
}

.contribution-day {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.contribution-day:hover {
  transform: scale(1.2);
  border: 1px solid #333;
}

/* Intensity colors - GitHub style */
.intensity-0 { background-color: #ebedf0; }
.intensity-1 { background-color: #9be9a8; }
.intensity-2 { background-color: #40c463; }
.intensity-3 { background-color: #30a14e; }
.intensity-4 { background-color: #216e39; }

.graph-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.legend-square {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
```

### Streak Display Styles
```css
.streak-display {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
}

.current-streak h2 {
  font-size: 3rem;
  margin: 0;
  font-weight: bold;
}

.motivation {
  margin: 16px 0;
  padding: 12px;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
}

.activity-status .active {
  color: #4ade80;
  font-weight: bold;
}
```

### Analytics Dashboard Styles
```css
.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #40c463;
}

.stat-card h3 {
  font-size: 2rem;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.stat-card p {
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

.insights {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.insights ul {
  list-style: none;
  padding: 0;
}

.insights li {
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}
```

---

## 🔧 Error Handling

### Common Error Responses
```json
{
  "status": "error",
  "message": "Authentication required",
  "code": 401
}

{
  "status": "error", 
  "message": "Invalid date format",
  "code": 400
}

{
  "status": "error",
  "message": "Server error",
  "code": 500
}
```

### Frontend Error Handling
```javascript
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Redirect to login
        window.location.href = '/login';
        return;
      }
      
      const errorData = await response.json();
      throw new Error(errorData.message || 'Có lỗi xảy ra');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    
    // Show user-friendly error message
    showErrorToast(error.message);
    
    return null;
  }
}

function showErrorToast(message) {
  // Implementation tùy theo UI framework
  console.error('User Error:', message);
}
```

---

## 🚀 Performance Tips

### 1. Caching Strategy
```javascript
// Cache contribution data for 1 hour
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

function getCachedData(key) {
  const cached = localStorage.getItem(key);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  return null;
}

function setCachedData(key, data) {
  localStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
}
```

### 2. Lazy Loading
```javascript
// Chỉ load detailed analytics khi user scroll đến
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadAnalyticsData();
      observer.unobserve(entry.target);
    }
  });
});

observer.observe(document.getElementById('analytics-section'));
```

### 3. Data Optimization
```javascript
// Chỉ lấy dữ liệu cần thiết cho mobile
const isMobile = window.innerWidth < 768;
const days = isMobile ? 90 : 365; // Mobile chỉ hiển thị 3 tháng

fetchContributionGraph({ days });
```

---

## 📱 Mobile Responsive

### CSS Media Queries
```css
/* Mobile optimization */
@media (max-width: 768px) {
  .graph-container {
    grid-template-columns: repeat(26, 1fr); /* Giảm số tuần hiển thị */
    gap: 1px;
  }
  
  .contribution-day {
    width: 8px;
    height: 8px;
  }
  
  .overview-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-card {
    padding: 12px;
  }
  
  .current-streak h2 {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .overview-stats {
    grid-template-columns: 1fr;
  }
  
  .graph-container {
    grid-template-columns: repeat(13, 1fr); /* Chỉ hiển thị 3 tháng */
  }
}
```

---

## 🎯 Use Cases & Examples

### 1. Personal Learning Dashboard
```javascript
// Tạo dashboard học tập cá nhân
class PersonalDashboard {
  async render() {
    const [graph, streaks, summary] = await Promise.all([
      this.fetchContributionGraph(),
      this.fetchStreaks(), 
      this.fetchSummary()
    ]);
    
    this.renderHeader(streaks);
    this.renderContributionGraph(graph);
    this.renderQuickStats(summary.overview);
    this.renderMotivation(streaks.streakInfo);
  }
}
```

### 2. Gamification Features
```javascript
// Achievement system dựa trên streaks
function checkAchievements(streakData) {
  const achievements = [];
  
  if (streakData.currentStreak >= 7) {
    achievements.push({
      id: 'week_streak',
      title: '🔥 Tuần hoàn hảo',
      description: 'Học 7 ngày liên tiếp'
    });
  }
  
  if (streakData.longestStreak >= 30) {
    achievements.push({
      id: 'month_master',
      title: '🏆 Master 30 ngày',
      description: 'Duy trì streak 30 ngày'
    });
  }
  
  return achievements;
}
```

### 3. Social Features
```javascript
// So sánh với bạn bè (nếu có feature social)
async function compareWithFriends(userStats) {
  // Implementation cho social comparison
  console.log('User stats:', userStats);
}
```

---

## 🎉 Kết luận

API Contribution Graph cung cấp đầy đủ dữ liệu để tạo ra một hệ thống learning analytics mạnh mẽ và hấp dẫn. Với 3 endpoints chính, bạn có thể xây dựng:

- ✅ **GitHub-style contribution graph**
- ✅ **Streak system cho gamification** 
- ✅ **Analytics dashboard cho insights**
- ✅ **Mobile-responsive interface**
- ✅ **Performance optimization**

Hãy sử dụng Postman collection để test và khám phá các tính năng! 🚀