/**
 * Vercel Serverless Function: YouTube Search
 * Endpoint: POST /api/youtube
 * 
 * Searches YouTube for educational videos
 */

import {
  handleCors,
  sendError,
  sendSuccess,
  validateEnvVars,
  checkRateLimit,
  getClientIP,
  parseJsonBody
} from './_utils.js'

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return

  // Only allow POST requests
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed')
  }

  try {
    // Validate environment variables
    validateEnvVars(['YOUTUBE_API_KEY'])

    // Rate limiting: 15 requests per minute per IP
    const clientIP = getClientIP(req)
    if (!checkRateLimit(clientIP, 15, 60000)) {
      return sendError(res, 429, 'Too many requests. Please try again later.')
    }

    // Validate request body (parse if needed)
    const body = await parseJsonBody(req)
    const { keywords, maxResults = 3 } = body

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return sendError(res, 400, 'Missing or invalid keywords array')
    }

    const maxResultsNum = Number(maxResults)
    if (isNaN(maxResultsNum) || maxResultsNum < 1 || maxResultsNum > 10) {
      return sendError(res, 400, 'Invalid maxResults. Must be between 1 and 10')
    }

    // Build search query
    const searchQuery = keywords.join(' ')

    // Call YouTube Data API
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.append('key', process.env.YOUTUBE_API_KEY)
    url.searchParams.append('q', searchQuery)
    url.searchParams.append('part', 'snippet')
    url.searchParams.append('type', 'video')
    url.searchParams.append('maxResults', maxResultsNum.toString())
    url.searchParams.append('videoDuration', 'medium') // 4-20 minutes
    url.searchParams.append('relevanceLanguage', 'en')
    url.searchParams.append('safeSearch', 'strict')

    const response = await fetch(url.toString())

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('YouTube API error:', errorData)

      if (response.status === 403) {
        return sendError(res, 503, 'YouTube API quota exceeded. Please try again later.')
      }

      return sendError(res, 500, 'Failed to fetch YouTube videos')
    }

    const data = await response.json()

    // Transform response to match frontend format
    const videos = data.items?.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    })) || []

    return sendSuccess(res, videos)

  } catch (error) {
    console.error('Error in youtube search:', error)
    
    // Handle specific error types
    if (error.message?.includes('Missing required environment variables')) {
      return sendError(res, 500, 'Server configuration error: API key is missing.')
    }
    if (error.message?.includes('API key')) {
      return sendError(res, 500, 'YouTube service configuration error')
    }
    
    if (error.message?.includes('quota')) {
      return sendError(res, 503, 'YouTube service temporarily unavailable. Please try again later.')
    }

    return sendError(res, 500, 'An error occurred while searching YouTube')
  }
}



