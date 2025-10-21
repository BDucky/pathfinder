/**
 * API Configuration
 * Automatically detects whether to use backend API or client-side API keys
 */

// Check if running in production with backend API available
const isProduction = import.meta.env.PROD
const hasBackendAPI = import.meta.env.VITE_API_MODE === 'production'

/**
 * API Mode:
 * - 'backend': Use serverless functions (production)
 * - 'client': Use client-side API keys (development or self-hosted)
 */
export const API_MODE = hasBackendAPI ? 'backend' : 'client'

/**
 * API Base URL for backend mode
 */
export const API_BASE_URL = isProduction 
  ? '/api'  // Production: Vercel serverless functions
  : 'http://localhost:5173/api' // Development: Local dev server

/**
 * Check if client has API keys stored locally
 */
export function hasLocalApiKeys() {
  const geminiKey = localStorage.getItem('gemini_api_key')
  const youtubeKey = localStorage.getItem('youtube_api_key')
  return !!(geminiKey && youtubeKey)
}

/**
 * Check if any AI chat API is available (Gemini or Groq)
 */
export function hasChatApiKey() {
  const geminiKey = localStorage.getItem('gemini_api_key')
  const groqKey = localStorage.getItem('groq_api_key')
  return !!(geminiKey || groqKey)
}

/**
 * Determine which mode to use
 * Priority: Backend API > Local API Keys
 */
export function getActiveMode() {
  // If backend API is available, always use it
  if (API_MODE === 'backend') {
    return 'backend'
  }
  
  // Otherwise, use client mode if keys are available
  if (hasLocalApiKeys()) {
    return 'client'
  }
  
  return null // No API available
}

/**
 * Build API endpoint URL
 */
export function getApiUrl(endpoint) {
  const mode = getActiveMode()
  
  if (mode === 'backend') {
    return `${API_BASE_URL}${endpoint}`
  }
  
  return null // Client mode doesn't use URLs
}

/**
 * API Client wrapper for making requests
 */
export async function apiRequest(endpoint, data) {
  const url = getApiUrl(endpoint)
  
  if (!url) {
    throw new Error('API not configured')
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'API request failed')
    }

    return result.data

  } catch (error) {
    console.error(`API request failed (${endpoint}):`, error)
    throw error
  }
}

/**
 * Get user-friendly API mode description
 */
export function getApiModeDescription() {
  const mode = getActiveMode()
  
  if (mode === 'backend') {
    return {
      mode: 'backend',
      title: '🌐 Backend API Mode',
      description: 'Sử dụng API từ server - Không cần cấu hình API keys'
    }
  }
  
  if (mode === 'client') {
    return {
      mode: 'client',
      title: '🔑 Client Mode',
      description: 'Sử dụng API keys của bạn - Đã cấu hình sẵn'
    }
  }
  
  return {
    mode: null,
    title: '⚠️ Chưa cấu hình',
    description: 'Vui lòng cấu hình API keys để sử dụng'
  }
}

