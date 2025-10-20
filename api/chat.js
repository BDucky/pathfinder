/**
 * Vercel Serverless Function: AI Chat
 * Endpoint: POST /api/chat
 * 
 * Supports both Google Gemini and Groq AI for chat functionality
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
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
    // Rate limiting: 20 requests per minute per IP (chat needs more quota)
    const clientIP = getClientIP(req)
    if (!checkRateLimit(clientIP, 20, 60000)) {
      return sendError(res, 429, 'Too many requests. Please try again later.')
    }

    // Validate request body (parse if needed)
    const body = await parseJsonBody(req)
    const { message, provider, systemContext, conversationHistory } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return sendError(res, 400, 'Missing or invalid message')
    }

    if (!provider || !['gemini', 'groq'].includes(provider)) {
      return sendError(res, 400, 'Invalid provider. Must be "gemini" or "groq"')
    }

    // Check if required API key exists for the selected provider
    if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
      return sendError(res, 503, 'Gemini AI is not configured on this server')
    }

    if (provider === 'groq' && !process.env.GROQ_API_KEY) {
      return sendError(res, 503, 'Groq AI is not configured on this server')
    }

    let aiResponse

    // Route to appropriate AI provider
    if (provider === 'gemini') {
      aiResponse = await chatWithGemini(message, systemContext, conversationHistory)
    } else if (provider === 'groq') {
      aiResponse = await chatWithGroq(message, systemContext, conversationHistory)
    }

    return sendSuccess(res, { response: aiResponse })

  } catch (error) {
    console.error('Error in chat:', error)
    
    // Handle specific error types
    if (error.message?.includes('API key')) {
      return sendError(res, 500, 'AI service configuration error')
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return sendError(res, 503, 'AI service temporarily unavailable. Please try again later.')
    }

    return sendError(res, 500, 'An error occurred while processing your message')
  }
}

/**
 * Chat with Google Gemini AI
 */
async function chatWithGemini(message, systemContext, conversationHistory = []) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  // Use current Gemini model naming
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-pro',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    }
  })

  // Build conversation history for Gemini
  const history = conversationHistory
    .slice(-10) // Keep last 10 messages to avoid token limits
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

  // Start chat with history
  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 1024,
    },
  })

  // Add system context to the message
  const contextualMessage = systemContext 
    ? `${systemContext}\n\n---\n\nUser: ${message}`
    : message

  const result = await chat.sendMessage(contextualMessage)
  const response = await result.response
  return response.text()
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
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 1024,
    top_p: 1,
    stream: false
  })

  return chatCompletion.choices[0]?.message?.content || 'No response'
}



