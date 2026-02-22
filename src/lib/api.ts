import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://expoflow-api.thedeft.co'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a response interceptor to handle errors uniformly if needed
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // We can log errors here or transform them
    // For now, just reject so the caller handles it
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default api
