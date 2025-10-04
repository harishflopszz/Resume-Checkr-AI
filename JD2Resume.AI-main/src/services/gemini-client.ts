// src/services/gemini-client.ts
// --- MULTI-METHOD GEMINI API CALLER ---

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
console.log('Gemini API Key loaded:', API_KEY ? 'Yes (' + API_KEY.substring(0, 10) + '...)' : 'No');

/**
 * A helper function to introduce a delay.
 * @param ms The number of milliseconds to wait.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Method 1: Direct HTTP request to Gemini API (alternative approach)
 */
async function callGeminiDirect<T>(prompt: string): Promise<T> {
  if (!API_KEY) {
    throw new Error("Missing API_KEY: aborting external Gemini call");
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error('No response text received from API');
  }

  const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
  const fixedJson = cleanedJson
    .replace(/'([^']+)'\s*:/g, '"$1":')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');

  return JSON.parse(fixedJson) as T;
}

/**
 * Method 2: Server-side proxy approach
 */
async function callGeminiProxy<T>(prompt: string): Promise<T> {
  const response = await fetch('/.netlify/functions/gemini-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result as T;
}

/**
 * Check if we should prefer direct API calls over proxy
 */
function shouldPreferDirectCalls(): boolean {
  // Force direct calls for mobile testing - this will work from any browser
  console.log('Environment check:', {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    hostname: window.location.hostname
  });

  // Always prefer direct calls in development to avoid localhost proxy issues
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    console.log('Using direct API calls in development mode');
    return true;
  }

  // In production, use proxy by default unless network issues detected
  return false;
}

/**
 * Main function that tries multiple calling methods with fallback
 */
export async function callGemini<T>(prompt: string, retries = 3, delay = 2000): Promise<T> {
  // FORCE DIRECT API CALLS IN DEVELOPMENT - This fixes mobile testing issues
  // Netlify functions don't work locally in Vite dev server
  const isDevMode = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const methods = isDevMode
    ? [callGeminiDirect, callGeminiProxy]  // Development: Direct calls first
    : [callGeminiProxy]; // Production: Only proxy

  console.log('Gemini call setup:', {
    isDevMode,
    methodCount: methods.length,
    methodNames: methods.map((_, i) => i === 0 ? 'Direct API' : 'Proxy')
  });

  for (let methodIndex = 0; methodIndex < methods.length; methodIndex++) {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Trying method ${methodIndex + 1}, attempt ${i + 1}/${retries}`);
        return await methods[methodIndex](prompt);

      } catch (error: any) {
        console.error(`Error calling Gemini API (method ${methodIndex + 1}, attempt ${i + 1}/${retries}):`, error);

        const isLastMethod = methodIndex === methods.length - 1;
        const isLastAttempt = i === retries - 1;
        const isRateLimitError = error.toString().includes('429') || error.message.includes('quota');
        const isServiceUnavailable = error.toString().includes('503') || error.message.includes('overloaded');
        const isNetworkError = error.toString().includes('network') || error.toString().includes('fetch');

        if (isLastMethod && isLastAttempt) {
          if (isRateLimitError) {
            throw new Error("You have exceeded your API quota. Please check your plan and billing details, or try again later.");
          }
          if (isServiceUnavailable) {
            throw new Error("The AI service is currently overloaded. Please try again in a few moments.");
          }
          if (error instanceof Error && error.message.includes('SAFETY')) {
            throw new Error("The request was blocked due to safety settings. Please modify your input.");
          }
          if (isNetworkError) {
            throw new Error("Network connectivity issue. Please check your internet connection and try again.");
          }
          throw new Error("Failed to generate content from AI after multiple attempts.");
        }

        if (isServiceUnavailable || isNetworkError) {
          // Wait before retrying with exponential backoff
          await sleep(delay * Math.pow(2, i));
        } else if (isRateLimitError) {
          // Wait a longer, fixed time for rate limit errors
          await sleep(delay * Math.pow(2, i));
        } else if (isLastAttempt) {
          // Move to next method if this one failed completely
          break;
        } else {
          // For other errors (like safety), don't retry
          if (error instanceof Error && error.message.includes('SAFETY')) {
            throw new Error("The request was blocked due to safety settings. Please modify your input.");
          }
          await sleep(delay);
        }
      }
    }
  }

  throw new Error("All API calling methods failed. Please try again later.");
}
