/**
 * Vercel Serverless Function: AI Chat
 * Endpoint: POST /api/chat
 * 
 * Uses Groq AI for fast chat functionality.
 */

import Groq from 'groq-sdk'
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
    // Validate that Groq API key is configured
    try {
      validateEnvVars(['GROQ_API_KEY'])
    } catch (envError) {
      console.error('Environment variable validation failed:', envError.message)
      return sendError(res, 500, 'Server configuration error: AI provider is not configured.')
    }

    // Rate limiting: 20 requests per minute per IP
    const clientIP = getClientIP(req)
    if (!checkRateLimit(clientIP, 20, 60000)) {
      return sendError(res, 429, 'Too many requests. Please try again later.')
    }

    // Parse and validate request body
    const body = await parseJsonBody(req)
    const { message, systemContext, conversationHistory } = body
    
    console.log('Groq Chat request received:', { messageLength: message?.length })

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return sendError(res, 400, 'Missing or invalid message')
    }

    const aiResponse = await chatWithGroq(message, systemContext, conversationHistory)

    return sendSuccess(res, { response: aiResponse })

  } catch (error) {
    console.error('Error in chat:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    // Handle specific error types
    if (error.message?.includes('API key')) {
      return sendError(res, 500, 'AI service configuration error')
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate limit') || error.message?.includes('overloaded')) {
      return sendError(res, 503, 'AI service is overloaded. Please try again later.')
    }

    if (error.message?.includes('Safety') || error.message?.includes('blocked')) {
      return sendError(res, 400, 'Message blocked by safety filters. Please rephrase your message.')
    }

    // Return the actual error message for debugging
    return sendError(res, 500, error.message || 'An error occurred while processing your message')
  }
}

/**
 * Chat with Groq AI (Llama)
 */
async function chatWithGroq(message, systemContext, conversationHistory = []) {
  const groq = new Groq({ 
    apiKey: process.env.GROQ_API_KEY
  })

  // Build messages array
  const messages = []

  // Add system context if provided
  if (systemContext) {
    messages.push({
      role: 'system',
      content: systemContext
    })
  }

  // Add conversation history (last 10 messages)
  const recentHistory = conversationHistory.slice(-10)
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role,
      content: msg.content
    })
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: message
  })

  // Call Groq API
  const chatCompletion = await groq.chat.completions.create({
    messages,
    model: 'llama-3.1-8b-instant', // Using a smaller, faster model for chat
    temperature: 0.7,
    max_tokens: 1024,
    top_p: 1,
    stream: false
  })

  return chatCompletion.choices[0]?.message?.content || 'No response'
}



