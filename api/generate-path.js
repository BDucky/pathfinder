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
  getClientIP
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
    validateEnvVars(['GEMINI_API_KEY'])

    // Rate limiting: 10 requests per minute per IP
    const clientIP = getClientIP(req)
    if (!checkRateLimit(clientIP, 10, 60000)) {
      return sendError(res, 429, 'Too many requests. Please try again later.')
    }

    // Validate request body
    const { topic, level, duration, hoursPerWeek } = req.body

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
    if (!validLevels.includes(finalLevel)) {
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
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    // Use current Gemini model naming (1.5-pro)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Generate learning path using AI
    const prompt = `You are an expert learning path designer. Create a detailed, personalized learning roadmap.

Input:
- Topic: ${topic}
- Current Level: ${level}
- Duration: ${durationNum} weeks
- Hours per week: ${hoursNum}

Create a structured learning path with the following requirements:
1. Break down the learning journey into ${durationNum} weeks
2. Each week should have:
   - Week number and title
   - Learning objectives (2-4 specific goals)
   - Topics to cover (3-5 subtopics)
   - Estimated hours needed
   - Search keywords for finding relevant videos (2-3 keywords optimized for YouTube search)
3. Progression should be logical and appropriate for the skill level
4. Include practical projects or exercises

Return ONLY a valid JSON object (no markdown, no code blocks) in this exact structure:
{
  "title": "Learning path title",
  "topic": "${topic}",
  "level": "${finalLevel}",
  "totalWeeks": ${durationNum},
  "hoursPerWeek": ${hoursNum},
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Week title",
      "objectives": ["objective 1", "objective 2"],
      "topics": ["topic 1", "topic 2", "topic 3"],
      "estimatedHours": 10,
      "searchKeywords": ["keyword1 tutorial", "keyword2 beginner"],
      "exercises": "Practical exercise description"
    }
  ]
}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()

    // Clean up response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Parse JSON
    let pathStructure
    try {
      pathStructure = JSON.parse(text)
    } catch (parseError) {
      console.error('Failed to parse AI response:', text)
      return sendError(res, 500, 'AI returned invalid format. Please try again.')
    }

    // Return successful response
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



