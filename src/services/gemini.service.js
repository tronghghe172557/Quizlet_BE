import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";

// Multiple API keys for failover
const apiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY_6,
  process.env.GEMINI_API_KEY_7,
  process.env.GEMINI_API_KEY_8,
].filter(Boolean); // Remove empty keys

if (apiKeys.length === 0) {
  console.warn(
    "No GEMINI_API_KEY found. Quiz generation will fail until configured."
  );
}

const DEFAULT_MODEL = "gemini-2.0-flash";
const RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;

function buildPromptFromText(sourceText, quizConfig = null, promptExtension = null) {
  // Nếu có prompt mở rộng, sử dụng prompt tùy chỉnh
  if (promptExtension && promptExtension.trim()) {
    return `
${promptExtension}

📊 QUIZ CONFIG:
${JSON.stringify(quizConfig, null, 2)}

📝 SOURCE TEXT:
${sourceText}

⚠️ OUTPUT FORMAT: Must be valid JSON with "questions" array containing objects with "prompt", "choices" (array of {text, isCorrect}), and "explanation" fields.
`;
  }

  // Nếu có config, sử dụng format mới
  if (quizConfig) {
    return `
Bạn là "Cô Trang", một giáo viên tiếng Anh với hơn 10 năm kinh nghiệm. Hãy tạo quiz theo đúng config sau:

${JSON.stringify(quizConfig, null, 2)}

⚠️ QUY TẮC QUAN TRỌNG:
- Always output in STRICT JSON format (no extra text).
- Include ALL metadata fields exactly as provided.
- "questions" must be an array of quiz items.
- Each question must have exactly ${
      quizConfig["số lựa chọn trong 1 câu"]
    } choices, and only one is correct.

📌 OUTPUT FORMAT:
{
  "số câu": ${quizConfig["số câu"]},
  "dạng tạo câu hỏi": "${quizConfig["dạng tạo câu hỏi"]}",
  "số lựa chọn trong 1 câu": ${quizConfig["số lựa chọn trong 1 câu"]},
  "note": "${quizConfig.note}",
  "từ mới": ${JSON.stringify(quizConfig["từ mới"])},
  "cấp độ tiếng Anh": "${quizConfig["cấp độ tiếng Anh"]}",
  "ngôn ngữ hiển thị câu hỏi": "${quizConfig["ngôn ngữ hiển thị câu hỏi"]}",
  "questions": [
    {
      "prompt": "string - Nội dung câu hỏi theo cấp độ ${
        quizConfig["cấp độ tiếng Anh"]
      }",
      "choices": [
        {"text": "string", "isCorrect": boolean},
        {"text": "string", "isCorrect": boolean},
        {"text": "string", "isCorrect": boolean},
        {"text": "string", "isCorrect": boolean}
      ],
      "explanation": "string - Giải thích bằng ${
        quizConfig["ngôn ngữ hiển thị câu hỏi"]
      }"
    }
  ]
}

📝 LOẠI CÂU HỎI THEO "${quizConfig["dạng tạo câu hỏi"]}":
${getQuestionTypeInstructions(
  quizConfig["dạng tạo câu hỏi"],
  quizConfig["cấp độ tiếng Anh"]
)}

Từ vựng để tạo quiz: ${sourceText}
`;
  }

  // Format cũ cho backward compatibility
  const questions = sourceText.split("\n").filter((line) => line.trim() !== "");
  console.log(questions);
  return `
Bạn là "Cô Trang", một giáo viên tiếng Anh với hơn 10 năm kinh nghiệm, chuyên dạy cho người mất gốc. Phong cách của bạn rất gần gũi, thực tế, và thường dùng các mẹo hài hước để giúp học viên nhớ bài. Nhiệm vụ của bạn là tạo ra một bài kiểm tra trắc nghiệm dạng JSON từ một đoạn văn bản cho trước.

Quy tắc:
- Nguồn Dữ liệu: Toàn bộ thông tin về từ (định nghĩa, phát âm, từ loại) PHẢI được tra cứu và xác minh từ các nguồn từ điển uy tín, ưu tiên Oxford Learner's Dictionaries.
- Xác định từ vựng: List từ ${questions} ( mỗi dòng là 1 câu hỏi mới ) được cung cấp, hãy xác định tất cả các từ vựng mới hoặc quan trọng phù hợp với trình độ B1.
- tổng là ${questions.length} câu hỏi.
- Một từ - một câu hỏi: Với MỖI TỪ vựng tìm được, hãy tạo ra một câu hỏi trắc nghiệm tương ứng.
- Định dạng đầu ra: Kết quả phải là một file JSON TUYỆT ĐỐI CHÍNH XÁC theo cấu trúc đã cho. Không thêm bất kỳ văn bản nào khác ngoài JSON.

{
  "questions": [
    {
      "prompt": "Từ mới: [The English Word]\\nĐịnh nghĩa (EN): [English definition from a reliable dictionary]\\nTừ loại: [Part of speech, e.g., noun, verb, adj]\\nNghĩa tiếng Việt: [Accurate Vietnamese meaning]\\nMẹo ghi nhớ: [A fun, practical, or funny tip in 'Cô Trang' style]\\nPhát âm (IPA): /[pronunciation]/\\nTừ đồng nghĩa:[Synonyms if available]\\nTừ trái nghĩa: [Antonyms if available]",
      "question": "[The English Word] trong tiếng Việt có nghĩa là gì?",
      "choices": [
        {"text": "Nghĩa tiếng Việt sai 1", "isCorrect": false},
        {"text": "Nghĩa tiếng Việt sai 2", "isCorrect": false},
        {"text": "Nghĩa tiếng Việt đúng", "isCorrect": true},
        {"text": "Nghĩa tiếng Việt sai 3", "isCorrect": false}
      ],
      "explanation": "Hội thoại/Ví dụ thực tế: [A short, natural dialogue or a practical example sentence showing how the word is used in daily life. Make it fun and relatable.]"
    }
  ]
}

Yêu cầu chi tiết cho từng trường:

prompt: Đây là phần "thẻ học từ vựng" (flashcard).
- Mỗi thông tin phải nằm trên một dòng riêng biệt (sử dụng \\n).
- Mẹo ghi nhớ: Phải thật sáng tạo, dễ liên tưởng. Ví dụ: "Từ 'diligent' (siêng năng) nghe hơi giống 'đi đi dần'. Muốn thành công thì cứ 'đi đi dần' là tới, phải siêng năng lên!"

question: Câu hỏi phải ngắn gọn, hỏi trực tiếp nghĩa tiếng Việt của từ.

choices:
- Luôn có 4 lựa chọn.
- Chỉ có 1 đáp án đúng ("isCorrect": true).
- Các đáp án sai phải hợp lý, có thể là những từ gần nghĩa hoặc cùng chủ đề để tăng tính thử thách, tránh đưa ra những đáp án sai hoàn toàn vô lý.

explanation:
- Đây là phần quan trọng nhất để học theo ngữ cảnh.
- Hãy tạo một đoạn hội thoại ngắn hoặc câu ví dụ thực tế, hài hước mà người Việt Nam dễ dàng liên tưởng.
- Ví dụ cho từ "versatile" (đa năng):
  A: "Wow, cái nồi chiên không dầu này 'versatile' thật sự! Nướng bánh, hấp rau, quay gà, làm được hết!"
  B: "Đúng là 'đỉnh của chóp' luôn, xứng đáng đồng tiền bát gạo."

Văn bản nguồn (Source Text): ${sourceText}
`;
}

function getQuestionTypeInstructions(questionType, level) {
  const instructions = {
    vocabulary: `
- Tạo câu hỏi về nghĩa của từ vựng
- Bao gồm IPA pronunciation
- Đưa ra các lựa chọn cùng chủ đề để tăng độ khó
- Thêm mẹo ghi nhớ thú vị`,

    grammar: `
- Tạo câu hỏi về ngữ pháp (thì, cấu trúc câu, từ loại)
- Phù hợp với cấp độ ${level}
- Đưa ra các lỗi ngữ pháp phổ biến làm distractor
- Giải thích quy tắc ngữ pháp`,

    reading: `
- Tạo đoạn văn ngắn và câu hỏi hiểu đọc
- Độ dài phù hợp với cấp độ ${level}
- Câu hỏi về main idea, details, inference
- Context clues cho vocabulary`,

    conversation: `
- Tạo tình huống giao tiếp thực tế
- Hỏi về response phù hợp
- Bao gồm cả formal và informal language
- Phù hợp văn hóa Việt Nam`,

    mixed: `
- Kết hợp tất cả các loại: vocabulary (40%), grammar (30%), reading (20%), conversation (10%)
- Đảm bảo đa dạng và cân bằng
- Tăng dần độ khó trong quiz
- Tập trung vào practical usage`,
  };

  return instructions[questionType] || instructions.mixed;
}

// Helper function to wait
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Try with different API keys
async function tryWithApiKey(
  apiKey,
  sourceText,
  modelName,
  retryCount = 0,
  quizConfig = null,
  promptExtension = null
) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  const prompt = buildPromptFromText(sourceText, quizConfig, promptExtension);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Attempt to extract JSON
    let jsonText = text.trim();
    // If model wrapped JSON in code fences
    if (jsonText.startsWith("```")) {
      const match = jsonText.match(/```(?:json)?\n([\s\S]*?)\n```/i);
      if (match) jsonText = match[1];
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      throw new Error("Failed to parse Gemini output as JSON");
    }

    if (
      !parsed?.questions ||
      !Array.isArray(parsed.questions) ||
      parsed.questions.length === 0
    ) {
      throw new Error("Gemini returned invalid quiz structure");
    }

    return {
      model: modelName,
      questions: parsed.questions,
      metadata: quizConfig || {},
      apiKeyUsed: apiKey.substring(0, 10) + "...",
    };
  } catch (error) {
    // Check if it's a rate limit or overload error
    if (
      error.message.includes("overloaded") ||
      error.message.includes("503") ||
      error.message.includes("rate limit") ||
      error.message.includes("429")
    ) {
      if (retryCount < MAX_RETRIES) {
        console.log(
          `API key ${apiKey.substring(
            0,
            10
          )}... overloaded, retrying in ${RETRY_DELAY}ms... (attempt ${
            retryCount + 1
          }/${MAX_RETRIES})`
        );
        await sleep(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        return tryWithApiKey(
          apiKey,
          sourceText,
          modelName,
          retryCount + 1,
          quizConfig,
          promptExtension
        );
      }
    }

    throw error;
  }
}

export async function generateQuizFromText(
  sourceText,
  modelName = DEFAULT_MODEL,
  quizConfig = null,
  promptExtension = null
) {
  if (apiKeys.length === 0) {
    throw new Error("No Gemini API keys configured");
  }

  let lastError;

  // Try each API key
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    console.log(
      `Trying API key ${i + 1}/${apiKeys.length}: ${apiKey.substring(0, 10)}...`
    );

    try {
      const result = await tryWithApiKey(
        apiKey,
        sourceText,
        modelName,
        0,
        quizConfig,
        promptExtension
      );
      console.log(`✅ Success with API key ${apiKey.substring(0, 10)}...`);
      return result;
    } catch (error) {
      console.log(
        `❌ Failed with API key ${apiKey.substring(0, 10)}...: ${error.message}`
      );
      lastError = error;

      // If not the last key, wait before trying next one
      if (i < apiKeys.length - 1) {
        console.log(`Waiting ${RETRY_DELAY}ms before trying next API key...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  // If all API keys failed
  if (
    lastError?.message.includes("overloaded") ||
    lastError?.message.includes("503")
  ) {
    throw new Error(
      "All Gemini API keys are currently overloaded. Please try again in a few minutes."
    );
  }

  throw lastError || new Error("All API keys failed to generate quiz");
}

export default { generateQuizFromText };
