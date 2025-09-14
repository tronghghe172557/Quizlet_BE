# Quizrise Backend - AI Coding Instructions

## Architecture Overview

This is an English vocabulary quiz generation system with three core domains:
- **Quiz Generation**: AI-powered flashcard creation using Google Gemini
- **Quiz Submissions**: User testing with automatic scoring
- **Skills Management**: Categorized learning progression tracking

## Critical Development Patterns

### 1. Error Handling Convention
**Always wrap controllers with `asyncHandler`** from `src/helpers/asyncHandle.js`:
```js
import { asyncHandler } from '../helpers/asyncHandle.js';
router.post('/', asyncHandler(createQuiz));
```
The global error handler in `app.js` handles specific error types (Mongoose, Zod, MongoDB connection).

### 2. Validation Pattern
Use **Zod schemas** for request validation in controllers:
```js
const CreateQuizSchema = z.object({
  title: z.string().min(1, 'title không được để trống'),
  text: z.string().min(10, 'text quá ngắn, tối thiểu 10 ký tự'),
});
const { title, text } = CreateQuizSchema.parse(req.body);
```

### 3. AI Service Integration
**Gemini failover system** in `services/gemini.service.js`:
- Multiple API keys with automatic rotation on failures
- Structured prompts for Vietnamese English learning with "Cô Trang" persona
- Exponential backoff for rate limit handling
- JSON parsing with markdown code fence extraction

### 4. Database Patterns
**MongoDB schemas** follow these conventions:
- Use embedded schemas for arrays (ChoiceSchema, QuestionSchema, AnswerSchema)
- Disable `_id` for embedded schemas: `{ _id: false }`
- Add indexes for common queries: `userEmail`, `quiz`, `category`
- Virtual fields for computed properties (scorePercentage)

### 5. Route Organization
**Routes must be imported in `app.js`** in this order:
```js
app.use('/api/quizzes', quizzesRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/submissions', submissionsRouter);
```

## Key Business Logic

### Quiz Generation Workflow
1. User provides Vietnamese vocabulary words (one per line)
2. Gemini AI creates structured flashcards with IPA pronunciation, mnemonics
3. Each word becomes a multiple-choice question with 4 options
4. Questions stored with embedded choice arrays

### Submission Scoring System
- Automatic validation against quiz questions
- Score calculation: `(correctAnswers / totalQuestions) * 100`
- Answer tracking with `questionIndex` and `selectedChoiceIndex`
- Time tracking support for performance analytics

### Database Connection Strategy
**Graceful MongoDB handling** in `config/mongoose.js`:
- Auto-reconnection with 5-second retry intervals
- Connection event logging (connected, disconnected, error)
- Does NOT crash server on connection failures

## Development Commands
```bash
npm run dev        # Development with nodemon
npm start          # Production
docker-compose up  # Full stack with MongoDB
```

## Environment Requirements
**Required .env variables:**
- `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2` (failover keys)
- `MONGODB_URI` (connection with auth)
- `PORT` (default: 3001)
- `SKILL` (learning level: A2-B1)

## API Documentation Location
Import Postman collections from `postman/` directory for testing and sharing.