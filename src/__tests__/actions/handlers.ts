import { http, HttpResponse, delay } from 'msw'

export const handlers = [
  // Auth endpoints
  http.post('https://expoflow-api.thedeft.co/auth/c/signin', async ({ request }) => {
    await delay(100)
    const formData = await request.formData()
    const username = formData.get('username')
    const password = formData.get('password')

    if (username === 'admin' && password === 'password123') {
      return HttpResponse.json({
        code: 200,
        data: {
          access_token: 'mock-admin-token',
          uuid: 'admin-123',
          com_uuid: 'company-456',
          expires_in: 604800,
        },
      })
    }

    return HttpResponse.json(
      {
        code: 401,
        message: 'Invalid username or password',
      },
      { status: 401 }
    )
  }),

  http.post('https://expoflow-api.thedeft.co/auth/organizer/signin', async ({ request }) => {
    await delay(100)
    const formData = await request.formData()
    const username = formData.get('username')
    const password = formData.get('password')

    if (username === 'organizer' && password === 'password123') {
      return HttpResponse.json({
        code: 200,
        data: {
          access_token: 'mock-organizer-token',
          organizer_uuid: 'organizer-123',
          project_uuid: 'project-456',
          expires_in: 604800,
        },
      })
    }

    return HttpResponse.json(
      {
        code: 401,
        message: 'Invalid username or password',
      },
      { status: 401 }
    )
  }),
]
