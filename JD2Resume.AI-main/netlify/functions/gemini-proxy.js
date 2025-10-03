// Netlify Function Proxy for Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Prompt is required' })
      };
    }

    // Use server-only environment variable
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Server configuration error: API key not configured' })
      };
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const generationConfig = {
      temperature: 0,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    };

    const safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ];

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig,
      safetySettings
    });

    const response = await result.response;
    const responseText = response.text();

    if (!responseText) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No response text received from API' })
      };
    }

    // Clean and parse JSON response
    const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const fixedJson = cleanedJson
      .replace(/'([^']+)'\s*:/g, '"$1":')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');

    try {
      const parsedResponse = JSON.parse(fixedJson);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(parsedResponse)
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Cleaned response:', cleanedJson);
      
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Invalid JSON response from Gemini API',
          rawResponse: cleanedJson
        })
      };
    }

  } catch (error) {
    console.error('Gemini proxy error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;

    if (error.toString().includes('429') || error.message.includes('quota')) {
      errorMessage = 'API quota exceeded';
      statusCode = 429;
    } else if (error.toString().includes('503') || error.message.includes('overloaded')) {
      errorMessage = 'Service temporarily unavailable';
      statusCode = 503;
    } else if (error.message.includes('SAFETY')) {
      errorMessage = 'Request blocked due to safety settings';
      statusCode = 400;
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network connectivity issue';
      statusCode = 502;
    }

    return {
      statusCode,
      headers: corsHeaders,
      body: JSON.stringify({ error: errorMessage })
    };
  }
};