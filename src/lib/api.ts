import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://expoflow-api.thedeft.co'

// Sensitive fields that should never be logged
const SENSITIVE_FIELDS = ['password', 'access_token', 'token', 'secret', 'authorization', 'x-api-key']

function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) return data
  if (typeof data === 'string') return data
  if (typeof data === 'number' || typeof data === 'boolean') return data
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item))
  }
  
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeData(value)
      }
    }
    return sanitized
  }
  
  return data
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a request interceptor to log payloads (sanitized)
api.interceptors.request.use((config) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('====== API REQUEST ======')
    console.log(`[${config.method?.toUpperCase()}] ${config.url}`)
    if (config.data) {
      const sanitized = sanitizeData(config.data)
      console.log('Payload:', JSON.stringify(sanitized, null, 2))
    }
    console.log('=========================')
  }
  return config
})

// Add a response interceptor to handle errors uniformly and log responses (sanitized)
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('====== API RESPONSE =====')
      console.log(`[${response.config.method?.toUpperCase()}] ${response.config.url}`)
      console.log('Status:', response.status)
      const sanitized = sanitizeData(response.data)
      console.log('Data:', JSON.stringify(sanitized, null, 2))
      console.log('=========================')
    }
    return response
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('====== API ERROR ======')
      console.log(`[${error.config?.method?.toUpperCase()}] ${error.config?.url}`)
      const sanitized = error.response?.data ? sanitizeData(error.response.data) : error.message
      console.error('Error Details:', sanitized)
      console.log('=======================')
    } else {
      // In production, only log generic message to prevent sensitive data exposure
      console.error('API Error occurred')
    }
    return Promise.reject(error)
  }
)

export default api
