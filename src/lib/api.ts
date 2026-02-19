import axios from 'axios'
import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://expoflow-api.thedeft.co'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a request interceptor to attach the auth token and project UUID
api.interceptors.request.use(async (config) => {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // If X-Project-UUID is explicitly passed in the config headers by the caller, 
  // Axios merges it. We don't need to do anything specifically here unless 
  // we wanted to pull it from somewhere else default.
  // The caller will do: api.get('/...', { headers: { 'X-Project-UUID': uuid } })

  return config
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
