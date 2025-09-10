import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

// Multiple API keys for failover
const apiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2
].filter(Boolean); // Remove empty keys

const skillLevel = process.env.SKILL || 'A2-B1';

if (apiKeys.length === 0) {
  console.warn('No GEMINI_API_KEY found. Quiz generation will fail until configured.');
}

const DEFAULT_MODEL = 'gemini-1.5-flash';
const RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;

function buildPromptFromText(sourceText) {
  return `You are a vocabulary and comprehension quiz generator.  
Given the following source text, produce a multiple-choice quiz in STRICT JSON format.  

Rules:
- Always generate exactly 5 questions.  
- Focus on vocabulary, synonyms, and meaning in context from the source text.  
- Each question must test understanding at ${skillLevel} English level.  
- Each question must have exactly 4 choices, only one is correct.  
- Choices must be short, clear, and plausible (avoid obvious wrong answers).  
- Include a short explanation for the correct answer (simple English).  
- Output STRICT JSON ONLY with this schema:

{
  "questions": [
    {
      "prompt": string,
      "choices": [
        {"text": string, "isCorrect": boolean},
        {"text": string, "isCorrect": boolean},
        {"text": string, "isCorrect": boolean},
        {"text": string, "isCorrect": boolean}
      ],
      "explanation": string
    }
  ]
}

Source Text:\n${sourceText}`;
}

// Helper function to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Try with different API keys
async function tryWithApiKey(apiKey, sourceText, modelName, retryCount = 0) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  const prompt = buildPromptFromText(sourceText);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Attempt to extract JSON
    let jsonText = text.trim();
    // If model wrapped JSON in code fences
    if (jsonText.startsWith('```')) {
      const match = jsonText.match(/```(?:json)?\n([\s\S]*?)\n```/i);
      if (match) jsonText = match[1];
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      throw new Error('Failed to parse Gemini output as JSON');
    }

    if (!parsed?.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Gemini returned invalid quiz structure');
    }

    return { model: modelName, questions: parsed.questions, apiKeyUsed: apiKey.substring(0, 10) + '...' };

  } catch (error) {
    // Check if it's a rate limit or overload error
    if (error.message.includes('overloaded') || error.message.includes('503') || 
        error.message.includes('rate limit') || error.message.includes('429')) {
      
      if (retryCount < MAX_RETRIES) {
        console.log(`API key ${apiKey.substring(0, 10)}... overloaded, retrying in ${RETRY_DELAY}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        return tryWithApiKey(apiKey, sourceText, modelName, retryCount + 1);
      }
    }
    
    throw error;
  }
}

export async function generateQuizFromText(sourceText, modelName = DEFAULT_MODEL) {
  if (apiKeys.length === 0) {
    throw new Error('No Gemini API keys configured');
  }

  let lastError;

  // Try each API key
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    console.log(`Trying API key ${i + 1}/${apiKeys.length}: ${apiKey.substring(0, 10)}...`);
    
    try {
      const result = await tryWithApiKey(apiKey, sourceText, modelName);
      console.log(`✅ Success with API key ${apiKey.substring(0, 10)}...`);
      return result;
    } catch (error) {
      console.log(`❌ Failed with API key ${apiKey.substring(0, 10)}...: ${error.message}`);
      lastError = error;
      
      // If not the last key, wait before trying next one
      if (i < apiKeys.length - 1) {
        console.log(`Waiting ${RETRY_DELAY}ms before trying next API key...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  // If all API keys failed
  if (lastError?.message.includes('overloaded') || lastError?.message.includes('503')) {
    throw new Error('All Gemini API keys are currently overloaded. Please try again in a few minutes.');
  }

  throw lastError || new Error('All API keys failed to generate quiz');
}

export default { generateQuizFromText };

