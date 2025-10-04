# Alternative Gemini API Calling Methods

This document describes the alternative methods implemented to handle Gemini API connectivity issues.

## Problem
The original implementation was calling Gemini API directly from the client-side, which caused:
- CORS issues
- Network connectivity problems (`net::ERR_INTERNET_DISCONNECTED`)
- Security concerns with API keys in client-side code
- Reliability issues with direct API calls

## Solutions Implemented

### 1. Server-Side Proxy (Primary Method)
**File**: `netlify/functions/gemini-proxy.js`

**How it works**:
- Creates a Netlify serverless function that acts as a proxy
- Handles API calls server-side, avoiding CORS issues
- Keeps API keys secure on the server
- Provides better error handling and retry logic

**Benefits**:
- ✅ No CORS issues
- ✅ API keys remain secure
- ✅ Better network reliability
- ✅ Proper error handling

### 2. Direct HTTP API Calls (Backup Method)
**File**: `src/services/gemini-client.ts` - `callGeminiDirect()`

**How it works**:
- Uses direct HTTP requests to Gemini API endpoint
- Alternative approach when proxy fails
- Uses the same API key but different calling mechanism

**Benefits**:
- ✅ Works when proxy has issues
- ✅ Simple HTTP-based approach
- ✅ No additional dependencies

### 3. Local Fallback Processing (Offline Mode)
**File**: `src/services/fallback-processor.ts`

**How it works**:
- Provides basic analysis when API is completely unavailable
- Uses simple keyword matching algorithms
- Gives users some functionality even offline

**Benefits**:
- ✅ Works completely offline
- ✅ Provides basic analysis functionality
- ✅ No external dependencies

## How to Use

The system automatically tries methods in this order:

1. **Server-Side Proxy** (Primary) - `/netlify/functions/gemini-proxy`
2. **Direct HTTP Calls** (Backup) - Direct to Gemini API
3. **Local Processing** (Fallback) - Offline keyword matching

## Configuration

### Environment Variables
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Netlify Configuration
The `netlify.toml` file is configured to:
- Serve functions from `netlify/functions` directory
- Handle API routing properly

## Testing

Run the test suite to verify all methods:
```bash
npm run dev
```

Then check the browser console for test results.

## Error Handling

The system includes comprehensive error handling:
- Network connectivity detection
- Rate limit handling
- Service unavailable retries
- Automatic fallback to alternative methods

## Performance Considerations

- **Caching**: Results are cached in localStorage for repeated analyses
- **Retry Logic**: Exponential backoff for retries
- **Method Switching**: Automatic failover between methods

## Security

- API keys are never exposed to client-side code
- Server-side proxy protects sensitive credentials
- All requests are validated and sanitized

## Mobile Testing in Development

### Problem
When testing mobile views in browser dev tools, API calls fail because:
- Mobile browsers can't access `localhost` on your desktop
- Netlify functions require tunneling in development

### Solutions

#### Option 1: Automatic Direct API Calls (Recommended for Development)
The app **automatically detects development mode** and prioritizes direct Gemini API calls, completely bypassing localhost proxy issues. This works perfectly for:
- Browser dev tools responsive design testing
- Mobile view simulation
- Local development without external tunneling

#### Option 2: Use ngrok for Full Functionality
1. Start your dev server: `npm run dev`
2. In another terminal: `npm run dev:ngrok`
3. Use the ngrok URL for mobile testing
4. This exposes both the app and Netlify functions

#### Option 3: Host-based Development
1. Run: `npm run dev:mobile`
2. Access via your computer's IP address
3. Mobile devices on the same network can connect

## Troubleshooting

If you encounter issues:

1. **Mobile connectivity**: Check if using `npm run dev:mobile` or ngrok
2. **Network connectivity**: Direct API calls should work from any device
3. **API key issues**: Verify `VITE_GEMINI_API_KEY` in `.env`
4. **Netlify functions**: Only work with proper tunneling in development
5. **Test all methods**: Use the provided test file to debug

## Future Enhancements

Potential improvements:
- Add support for multiple AI providers (OpenAI, Anthropic)
- Implement more sophisticated local processing
- Add request batching for better performance
- Implement usage analytics and monitoring