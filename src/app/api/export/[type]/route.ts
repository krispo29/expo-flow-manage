import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://expoflow-api.thedeft.co'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> } // In Next.js 15+ params are promises, but this project uses Next 15 (16.1.6 ? Wait, package.json says 16.1.6?! Actually Next 15 hasn't been released natively up to 16, maybe Next 15 canary. I'll just use the standard signature: { params: { type: string } } wait, let me check Next.js version in package.json: `next: 16.1.6` wait, is it really 16.x? Next.js 15 requires awaiting params in dynamic routes.)
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  const projectUuid = cookieStore.get('project_uuid')?.value

  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Await params if needed in Next.js 15+
  const resolvedParams = await params
  const type = resolvedParams.type

  let endpoint = ''
  switch (type) {
    case 'registrations-by-country':
      endpoint = '/v1/admin/project/report/export-excel-registration-by-country'
      break
    case 'questionnaires':
      endpoint = '/v1/admin/project/report/export-excel-questionnaire'
      break
    case 'attendees-summary':
      endpoint = '/v1/admin/project/report/export-excel-attendee-summary'
      break
    case 'edm-visitors':
      endpoint = '/v1/admin/project/report/export-excel-edm-visitor'
      break
    default:
      return new NextResponse('Invalid export type', { status: 400 })
  }

  const selectedEventUuid = request.nextUrl.searchParams.get('event_uuid')
  const actualEventUuid = selectedEventUuid || projectUuid || ''

  // Construct URL with event_uuid
  const url = `${API_URL}${endpoint}?event_uuid=${actualEventUuid}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Project-UUID': actualEventUuid,
      }
    })

    if (!response.ok) {
      console.error('Export error, status:', response.status)
      return new NextResponse('Error exporting file', { status: response.status })
    }

    // Forward the file response back to the client
    const headers = new Headers(response.headers)
    // Ensure content-disposition is passed through or force download
    // if not present, but the backend is probably setting it.

    return new NextResponse(response.body, {
      status: response.status,
      headers
    })
  } catch (error) {
    console.error('Error fetching export:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
