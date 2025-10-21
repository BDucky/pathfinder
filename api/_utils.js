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
 * Universal JSON body parser for Node.js serverless functions.
 * Handles different environments (Vercel dev/prod) gracefully.
 * - If middleware has already parsed `req.body` (dev), it's used.
 * - If `req.body` is a string, it's parsed.
 * - Otherwise, reads from the raw request stream (prod).
 */
export async function parseJsonBody(req) {
  // Case 1: Body is already available (from middleware like in Vite's dev server)
  if (req.body) {
    // Already parsed into an object
    if (typeof req.body === 'object') return req.body;
    // Is a string that needs parsing
    if (typeof req.body === 'string') {
      try {
        // Handle empty string body
        return JSON.parse(req.body || '{}');
      } catch (err) {
        throw new Error('Invalid JSON body');
      }
    }
    // Some other unexpected type, return empty
    return {};
  }

  // Case 2: Body needs to be read from stream (like on Vercel production)
  const methodHasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!methodHasBody) return {};

  let raw = '';
  await new Promise((resolve, reject) => {
    req.on('data', chunk => {
      raw += chunk;
    });
    req.on('end', resolve);
    req.on('error', reject);
  });
  
  try {
    // Handle empty raw body
    return JSON.parse(raw || '{}');
  } catch (err) {
    throw new Error('Invalid JSON body');
  }
}

