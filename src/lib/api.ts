import axios from 'axios'
import { isTokenExpiredError } from '@/lib/auth-helpers'

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
  async (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('====== API ERROR ======')
      console.log(`[${error.config?.method?.toUpperCase()}] ${error.config?.url}`)
      const sanitized = error.response?.data ? sanitizeData(error.response.data) : error.message
      console.error('Error Details:', sanitized)
      console.log('=======================')
    } else {
      // In production, only log generic message to prevent sensitive data exposure
      if (axios.isAxiosError(error) && isTokenExpiredError(error)) {
        console.error('API Error occurred: authentication expired')
      } else {
        console.error('API Error occurred')
      }
    }
    return Promise.reject(error)
  }
)

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const errorObj = data as { code?: number; message?: string }
      if (errorObj.message) {
        // Beautify common error messages
        let msg = errorObj.message
        if (msg === 'end_time must be after start_time') {
          return 'End time must be after Start time'
        }
        // Capitalize first letter if it's a simple sentence
        if (msg.length > 0 && /^[a-z]/.test(msg)) {
          msg = msg.charAt(0).toUpperCase() + msg.slice(1)
        }
        return msg
      }
    }
    return error.message
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred'
}

export default api
