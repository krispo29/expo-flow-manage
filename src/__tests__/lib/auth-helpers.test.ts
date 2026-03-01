import { isTokenExpiredError } from '@/lib/auth-helpers'
import type { AxiosError } from 'axios'

describe('isTokenExpiredError', () => {
  it('should return true for 400 status with "key incorrect" message', () => {
    const error = {
      response: {
        status: 400,
        data: {
          message: 'key incorrect',
        },
      },
    } as unknown as AxiosError<{ message?: string }>

    expect(isTokenExpiredError(error)).toBe(true)
  })

  it('should return true for 401 Unauthorized status', () => {
    const error = {
      response: {
        status: 401,
        data: {
          message: 'Unauthorized',
        },
      },
    } as unknown as AxiosError<{ message?: string }>

    expect(isTokenExpiredError(error)).toBe(true)
  })

  it('should return true for 401 status without message', () => {
    const error = {
      response: {
        status: 401,
        data: {},
      },
    } as unknown as AxiosError<{ message?: string }>

    expect(isTokenExpiredError(error)).toBe(true)
  })

  it('should return false for 400 status without "key incorrect" message', () => {
    const error = {
      response: {
        status: 400,
        data: {
          message: 'Bad request',
        },
      },
    } as unknown as AxiosError<{ message?: string }>

    expect(isTokenExpiredError(error)).toBe(false)
  })

  it('should return false for other 4xx errors', () => {
    const error403 = {
      response: {
        status: 403,
        data: {
          message: 'Forbidden',
        },
      },
    } as unknown as AxiosError<{ message?: string }>

    const error404 = {
      response: {
        status: 404,
        data: {
          message: 'Not found',
        },
      },
    } as unknown as AxiosError<{ message?: string }>

    const error422 = {
      response: {
        status: 422,
        data: {
          message: 'Validation error',
        },
      },
    } as unknown as AxiosError<{ message?: string }>

    expect(isTokenExpiredError(error403)).toBe(false)
    expect(isTokenExpiredError(error404)).toBe(false)
    expect(isTokenExpiredError(error422)).toBe(false)
  })

  it('should return false for 500 server errors', () => {
    const error = {
      response: {
        status: 500,
        data: {
          message: 'Internal server error',
        },
      },
    } as unknown as AxiosError<{ message?: string }>

    expect(isTokenExpiredError(error)).toBe(false)
  })

  it('should return false when error has no response', () => {
    const error = {
      message: 'Network error',
    } as unknown as AxiosError<{ message?: string }>

    expect(isTokenExpiredError(error)).toBe(false)
  })

  it('should return false when error response is undefined', () => {
    const error = {} as AxiosError<{ message?: string }>

    expect(isTokenExpiredError(error)).toBe(false)
  })

  it('should return false for 200 success response', () => {
    const error = {
      response: {
        status: 200,
        data: {
          message: 'Success',
        },
      },
    } as unknown as AxiosError<{ message?: string }>

    expect(isTokenExpiredError(error)).toBe(false)
  })
})
