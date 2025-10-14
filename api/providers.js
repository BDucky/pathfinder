/**
 * Vercel Serverless Function: Providers availability
 * Endpoint: GET /api/providers
 * 
 * Returns which AI/third-party providers are configured on the server
 */

import {
  handleCors,
  sendError,
  sendSuccess,
  checkRateLimit,
  getClientIP
} from './_utils.js'

export default async function handler(req, res) {
  // Handle CORS and preflight
  if (handleCors(req, res)) return

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed')
  }

  try {
    // Rate limit: light (10/min)
    const clientIP = getClientIP(req)
    if (!checkRateLimit(clientIP, 10, 60000)) {
      return sendError(res, 429, 'Too many requests. Please try again later.')
    }

    const hasGemini = !!process.env.GEMINI_API_KEY
    const hasGroq = !!process.env.GROQ_API_KEY
    const hasYouTube = !!process.env.YOUTUBE_API_KEY

    return sendSuccess(res, {
      providers: {
        gemini: hasGemini,
        groq: hasGroq,
        youtube: hasYouTube
      }
    })
  } catch (error) {
    console.error('Error in providers endpoint:', error)
    return sendError(res, 500, 'Failed to read provider configuration')
  }
}


