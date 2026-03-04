import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://expoflow-api.thedeft.co'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  const projectUuid = cookieStore.get('project_uuid')?.value

  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new NextResponse('Invalid JSON body', { status: 400 })
  }

  const endpoint = '/v1/admin/project/report/export-excel-advanced-search'
  const url = `${API_URL}${endpoint}` // event_uuid is passed via header or params if needed, but the curl just shows body and standard endpoint.

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Project-UUID': projectUuid || '',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.error('Export advanced search error, status:', response.status)
      return new NextResponse('Error exporting file', { status: response.status })
    }

    // Forward the file response back to the client
    const headers = new Headers(response.headers)
    
    // Explicitly set content disposition if backend provides it
    const contentDisposition = response.headers.get('content-disposition')
    if (contentDisposition) {
      headers.set('Content-Disposition', contentDisposition)
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers
    })
  } catch (error) {
    console.error('Error fetching export advanced search:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
