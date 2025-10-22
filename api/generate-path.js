/**
 * Vercel Serverless Function: Generate Learning Path
 * Endpoint: POST /api/generate-path
 * 
 * Uses Google Gemini AI to generate personalized learning paths
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
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
    try {
      validateEnvVars(['GEMINI_API_KEY'])
    } catch (envError) {
      console.error('Environment variable validation failed:', envError.message)
      return sendError(res, 500, 'Server configuration error: Missing API key. Please contact administrator.')
    }

    // Rate limiting: 10 requests per minute per IP
    const clientIP = getClientIP(req)
    if (!checkRateLimit(clientIP, 10, 60000)) {
      return sendError(res, 429, 'Too many requests. Please try again later.')
    }

    // Parse and validate request body
    const body = await parseJsonBody(req)
    const { topic, level, duration, hoursPerWeek } = body
    
    console.log('Request received:', { topic, level, duration, hoursPerWeek })

    if (!topic || !level || !duration || !hoursPerWeek) {
      return sendError(res, 400, 'Missing required fields: topic, level, duration, hoursPerWeek')
    }

    // Validate data types and ranges
    if (typeof topic !== 'string' || topic.trim().length === 0) {
      return sendError(res, 400, 'Invalid topic')
    }

    const validLevels = ['beginner', 'intermediate', 'advanced', 'expert']
    // Normalize level (accept lowercase values from client)
    const normalizedLevel = typeof level === 'string'
      ? level.trim().toLowerCase()
      : ''
    const levelMap = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      expert: 'Expert'
    }
    const finalLevel = levelMap[normalizedLevel] || level
    if (!validLevels.includes(normalizedLevel)) {
      return sendError(res, 400, 'Invalid level. Must be one of: ' + validLevels.join(', '))
    }

    const durationNum = Number(duration)
    const hoursNum = Number(hoursPerWeek)

    if (isNaN(durationNum) || durationNum < 1 || durationNum > 52) {
      return sendError(res, 400, 'Invalid duration. Must be between 1 and 52 weeks')
    }

    if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 168) {
      return sendError(res, 400, 'Invalid hoursPerWeek. Must be between 1 and 168 hours')
    }

    // Initialize Gemini AI
    console.log('Initializing Gemini AI...')
    console.log('API Key present:', !!process.env.GEMINI_API_KEY)
    console.log('API Key length:', process.env.GEMINI_API_KEY?.length)
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    // Using the latest stable and powerful model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096, // Limit output for faster generation
      }
    })
    console.log('Model initialized: gemini-1.5-pro')

    console.log('Generating learning path with AI (segmented)...')

    // Helpers: JSON cleanup and parsing
    function cleanToJson(text) {
      if (!text || typeof text !== 'string') return ''
      let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      // Prefer object, else array
      const objStart = cleaned.indexOf('{')
      const objEnd = cleaned.lastIndexOf('}')
      const arrStart = cleaned.indexOf('[')
      const arrEnd = cleaned.lastIndexOf(']')
      if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
        return cleaned.substring(objStart, objEnd + 1)
      }
      if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
        return cleaned.substring(arrStart, arrEnd + 1)
      }
      return cleaned
    }

    async function generateWeeksRange(startWeek, endWeek) {
      const segmentPrompt = `You are an expert learning path designer.

Create ONLY weeks ${startWeek}-${endWeek} for the learning path:
- Topic: ${topic}
- Level: ${finalLevel}
- Hours per week: ${hoursNum}

Return STRICTLY a JSON array (no markdown, no comments, no prose) of week objects with this exact schema:
[
  {
    "weekNumber": ${startWeek},
    "title": "Week title (<= 60 chars)",
    "objectives": ["objective 1", "objective 2"],
    "topics": ["topic 1", "topic 2", "topic 3"],
    "estimatedHours": 8,
    "searchKeywords": ["keyword1 tutorial", "keyword2 beginner"],
    "exercises": "Exercise (<= 120 chars)"
  }
]

Constraints:
- Keep strings concise
- Ensure weekNumber values are correct and sequential
- Array lengths: objectives 2, topics 3, searchKeywords 2
- Do NOT include any text outside the JSON array.`

      let segText
      try {
        const segResult = await model.generateContent(segmentPrompt)
        const segResponse = await segResult.response
        segText = cleanToJson(segResponse.text())
      } catch (e) {
        console.error(`Segment ${startWeek}-${endWeek} generation failed:`, e.message)
        throw new Error(`Failed to generate weeks ${startWeek}-${endWeek}: ${e.message}`)
      }

      try {
        const weeks = JSON.parse(segText)
        if (!Array.isArray(weeks)) throw new Error('Expected JSON array')
        return weeks
      } catch (e) {
        console.error(`Parse error for weeks ${startWeek}-${endWeek}:`, e.message)
        console.error('Segment text preview:', segText?.slice(0, 400))
        throw new Error(`Invalid JSON for weeks ${startWeek}-${endWeek}`)
      }
    }

    // Build title
    const title = `${finalLevel} ${topic} Learning Path`

    // Generate weeks in segments to avoid token/length issues
    const segmentSize = 8
    const allWeeks = []
    for (let start = 1; start <= durationNum; start += segmentSize) {
      const end = Math.min(durationNum, start + segmentSize - 1)
      const segWeeks = await generateWeeksRange(start, end)
      allWeeks.push(...segWeeks)
    }

    // Normalize and validate weeks
    const normalizedWeeks = allWeeks
      .filter(Boolean)
      .map((w, idx) => ({
        weekNumber: Number(w.weekNumber ?? idx + 1),
        title: String(w.title || `Week ${idx + 1}`),
        objectives: Array.isArray(w.objectives) ? w.objectives.slice(0, 3) : [],
        topics: Array.isArray(w.topics) ? w.topics.slice(0, 5) : [],
        estimatedHours: Number(w.estimatedHours || Math.round(hoursNum)),
        searchKeywords: Array.isArray(w.searchKeywords) ? w.searchKeywords.slice(0, 3) : [],
        exercises: String(w.exercises || 'Practice the covered topics')
      }))
      .slice(0, durationNum)

    if (normalizedWeeks.length !== durationNum) {
      console.error('Generated weeks count mismatch:', { expected: durationNum, got: normalizedWeeks.length })
      return sendError(res, 500, 'Failed to generate complete learning path. Please try again.')
    }

    const pathStructure = {
      title,
      topic,
      level: finalLevel,
      totalWeeks: durationNum,
      hoursPerWeek: hoursNum,
      weeks: normalizedWeeks
    }

    console.log('Sending success response')
    return sendSuccess(res, pathStructure)

  } catch (error) {
    console.error('Error in generate-path:', error)
    
    // Handle specific error types
    if (error.message?.includes('API key')) {
      return sendError(res, 500, 'AI service configuration error')
    }
    
    if (error.message?.includes('quota')) {
      return sendError(res, 503, 'AI service temporarily unavailable. Please try again later.')
    }

    return sendError(res, 500, 'An error occurred while generating the learning path')
  }
}



