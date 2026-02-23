import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://expoflow-api.thedeft.co'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a request interceptor to log payloads
api.interceptors.request.use((config) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('====== API REQUEST ======')
    console.log(`[${config.method?.toUpperCase()}] ${config.url}`)
    if (config.data) {
      console.log('Payload:', JSON.stringify(config.data, null, 2))
    }
    console.log('=========================')
  }
  return config
})

// Add a response interceptor to handle errors uniformly and log responses
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('====== API RESPONSE =====')
      console.log(`[${response.config.method?.toUpperCase()}] ${response.config.url}`)
      console.log('Status:', response.status)
      console.log('Data:', JSON.stringify(response.data, null, 2))
      console.log('=========================')
    }
    return response
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('====== API ERROR ======')
      console.log(`[${error.config?.method?.toUpperCase()}] ${error.config?.url}`)
      console.error('Error Details:', error.response?.data || error.message)
      console.log('=======================')
    } else {
      console.error('API Error:', error.response?.data || error.message)
    }
    return Promise.reject(error)
  }
)

export default api
