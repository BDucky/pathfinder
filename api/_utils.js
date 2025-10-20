/**
 * Utility functions for Vercel Serverless Functions
 * - Rate limiting
 * - Error handling
 * - CORS configuration
 */

// Simple in-memory rate limiter (will reset on cold start)
const rateLimitMap = new Map()

/**
 * Rate limiter middleware
 * @param {string} ip - Client IP address
 * @param {number} maxRequests - Max requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if allowed, false if rate limited
 */
export function checkRateLimit(ip, maxRequests = 10, windowMs = 60000) {
  const now = Date.now()
  const key = `${ip}`
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  const record = rateLimitMap.get(key)
  
  // Reset if window has passed
  if (now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  // Check if limit exceeded
  if (record.count >= maxRequests) {
    return false
  }
  
  // Increment count
  record.count++
  return true
}

/**
 * Get client IP from request headers
 */
export function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    'unknown'
  )
}

/**
 * Set CORS headers for response
 */
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
}

/**
 * Handle OPTIONS request for CORS
 */
export function handleCors(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true
  }
  return false
}

/**
 * Send error response
 */
export function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    error: message
  })
}

/**
 * Send success response
 */
export function sendSuccess(res, data) {
  return res.status(200).json({
    success: true,
    data
  })
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(requiredVars) {
  const missing = []
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}


/**
 * Parse JSON body for Node.js serverless functions
 * Vercel Node functions do not parse the body by default.
 * Returns the parsed object and also assigns it to req.body for convenience.
 */
export async function parseJsonBody(req) {
  // If another middleware already parsed it
  if (req.body && typeof req.body === 'object') {
    return req.body
  }

  // Only attempt to parse for methods that commonly include a body
  const methodHasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
  if (!methodHasBody) return {}

  let raw = ''
  await new Promise((resolve, reject) => {
    req.on('data', chunk => {
      raw += chunk
    })
    req.on('end', resolve)
    req.on('error', reject)
  })

  if (!raw) {
    req.body = {}
    return req.body
  }

  try {
    const parsed = JSON.parse(raw)
    req.body = parsed
    return parsed
  } catch (err) {
    throw new Error('Invalid JSON body')
  }
}

