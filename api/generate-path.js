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
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    // Try multiple model names for better compatibility
    const modelNames = ['gemini-1.5-pro', 'gemini-pro', 'gemini-1.5-flash']
    let model, modelName

    for (const name of modelNames) {
      try {
        console.log(`Trying model: ${name}`)
        model = genAI.getGenerativeModel({ model: name })
        modelName = name
        break
      } catch (modelError) {
        console.log(`Model ${name} failed:`, modelError.message)
        continue
      }
    }

    if (!model) {
      console.error('No compatible Gemini model found')
      return sendError(res, 500, 'No compatible AI model available. Please contact support.')
    }

    console.log(`Using model: ${modelName}`)

    console.log('Generating learning path with AI...')
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

    let result, response, text

    try {
      console.log('Calling Gemini API with prompt length:', prompt.length)
      result = await model.generateContent(prompt)
      console.log('Gemini API call completed')

      response = await result.response
      console.log('Response received from Gemini')

      text = response.text()
      console.log('AI response received, length:', text.length)
    } catch (aiError) {
      console.error('Gemini API error:', aiError)
      console.error('Error details:', {
        message: aiError.message,
        status: aiError.status,
        code: aiError.code,
        details: aiError.details
      })

      // Handle specific Gemini API errors
      if (aiError.message?.includes('API_KEY') || aiError.message?.includes('API key')) {
        return sendError(res, 500, 'Invalid API key. Please check your Gemini API key configuration.')
      }

      if (aiError.message?.includes('QUOTA') || aiError.message?.includes('quota')) {
        return sendError(res, 503, 'Gemini API quota exceeded. Please try again later.')
      }

      if (aiError.message?.includes('PERMISSION_DENIED') || aiError.message?.includes('permission')) {
        return sendError(res, 500, 'Gemini API access denied. Please check your API key permissions.')
      }

      if (aiError.message?.includes('MODEL_NOT_FOUND') || aiError.message?.includes('model')) {
        return sendError(res, 500, 'AI model not available. Please try again later.')
      }

      console.error('Unexpected AI error:', aiError)
      return sendError(res, 500, 'Failed to generate learning path. Please try again.')
    }

    // Clean up response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Parse JSON
    let pathStructure
    try {
      pathStructure = JSON.parse(text)
      console.log('Successfully parsed AI response')
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError.message)
      console.error('AI response preview:', text.substring(0, 500))
      return sendError(res, 500, 'AI returned invalid format. Please try again.')
    }

    // Return successful response
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



