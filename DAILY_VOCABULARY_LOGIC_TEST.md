## Test Daily Vocabulary với Quiz Model Mới

### Test Data - Quiz với vocabulary array:

```javascript
// Example quiz record in database
{
  title: "School Supplies Quiz",
  model: "gemini-2.0-flash",
  questionType: "vocabulary",
  englishLevel: "A2",
  vocabulary: [
    "1.notepad",
    "2.school bag", 
    "3.dictionary",
    "4.pocket money",
    "5.ink pot",
    "6.chalk",
    "7.glue",
    "8.textbook",
    "9.calculator",
    "10.scissors",
    "11.pencil sharpener",
    "12.maths",
    "13.geography",
    "14.history",
    "15.literature",
    "16.PE",
    "17.biology",
    "18.science",
    "19.art",
    "20.music"
  ]
}
```

### Expected Output:

```javascript
// Daily vocabulary generated
{
  vocabularyWords: [
    {
      word: "notepad",
      meaning: "Nghĩa của notepad",
      pronunciation: "",
      example: "Example with notepad",
      category: "vocabulary",
      difficulty: "beginner" // từ englishLevel: A2
    },
    {
      word: "school bag",
      meaning: "Nghĩa của school bag", 
      pronunciation: "",
      example: "Example with school bag",
      category: "vocabulary", 
      difficulty: "beginner"
    },
    // ... 8 từ nữa được random từ vocabulary array
  ]
}
```

### Logic Flow:

1. **Prioritize by Model**: `gemini-2.0-flash` > `gemini-pro` > other models
2. **Extract from vocabulary array**: Parse `"1.notepad"` → `"notepad"`
3. **Validate words**: Accept compound words like "school bag", "pocket money"
4. **Random selection**: Shuffle và lấy số lượng cần thiết
5. **Fallback**: Nếu không đủ từ từ quiz, dùng default words

### Benefits:

- ✅ **Đơn giản hóa**: Không cần parse phức tạp từ questions
- ✅ **Chính xác**: Lấy từ nguồn được chuẩn bị sẵn
- ✅ **Hiệu quả**: Ít processing, fast performance
- ✅ **Flexible**: Support cả single words và compound phrases
- ✅ **Quality**: Ưu tiên từ model mới nhất

### Test Command:

```javascript
// Trong Node.js console hoặc test file
const dailyVocab = await DailyVocabulary.createDailyVocabulary(userId, 10);
console.log(dailyVocab.vocabularyWords.map(w => w.word));
```