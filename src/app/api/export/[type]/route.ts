import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://expoflow-api.thedeft.co'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  const projectUuid = cookieStore.get('project_uuid')?.value
  const userRole = cookieStore.get('user_role')?.value || 'ADMIN'

  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Await params if needed in Next.js 15+
  const resolvedParams = await params
  const type = resolvedParams.type

  let endpoint = ''
  let includeQuestionnaire = false
  
  const isOrganizer = userRole === 'ORGANIZER'
  const baseEndpoint = isOrganizer ? '/v1/organizer/report' : '/v1/admin/project/report'

  if (type === 'import-history-codes') {
    const uuid = request.nextUrl.searchParams.get('uuid')
    const attendeeCode = request.nextUrl.searchParams.get('attendee_type_code')
    
    if (!uuid) return new NextResponse('Missing UUID', { status: 400 })

    let customUrl = `${API_URL}/v1/admin/project/import/histories/${uuid}/codes?format=excel`
    if (attendeeCode) customUrl += `&attendee_type_code=${attendeeCode}`

    try {
      const fetchRes = await fetch(customUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Project-UUID': projectUuid || '',
        }
      })
      if (!fetchRes.ok) return new NextResponse('Error', { status: fetchRes.status })
      const fetchHeaders = new Headers(fetchRes.headers)
      return new NextResponse(fetchRes.body, { status: fetchRes.status, headers: fetchHeaders })
    } catch (err) {
      return new NextResponse('Internal Server Error', { status: 500 })
    }
  }

  switch (type) {
    case 'registrations-by-country':
      endpoint = `${baseEndpoint}/export-excel-registrations-by-country`
      break
    case 'questionnaires':
      endpoint = `${baseEndpoint}/export-excel-questionnaire`
      break
    case 'attendees-summary':
      endpoint = `${baseEndpoint}/export-excel-attendee-summary`
      break
    case 'attendees-summary-by-questionnaire':
      endpoint = `${baseEndpoint}/export-excel-attendee-summary-by-questionnaire`
      break
    case 'edm-visitors':
      endpoint = `${baseEndpoint}/export-excel-edm-visitor`
      break
    case 'conference-no-hall':
      endpoint = `${baseEndpoint}/export-excel-conference-no-hall`
      break
    case 'conference-summary':
      endpoint = '/v1/admin/project/report/export-excel-conference-summary'
      break
    case 'participants':
      endpoint = `${baseEndpoint}/export-excel-participant`
      includeQuestionnaire = request.nextUrl.searchParams.get('include_questionnaire') === 'true'
      break
    default:
      return new NextResponse('Invalid export type', { status: 400 })
  }

  const selectedEventUuid = request.nextUrl.searchParams.get('event_uuid')
  const actualEventUuid = selectedEventUuid || projectUuid || ''

  // Construct URL with event_uuid
  let url = `${API_URL}${endpoint}?event_uuid=${actualEventUuid}`
  
  // Organizer endpoints often need project_uuid explicitly in query
  if (isOrganizer && projectUuid) {
    url += `&project_uuid=${projectUuid}`
  }

  if (type === 'participants') {
    url += `&include_questionnaire=${includeQuestionnaire}`
  }
  
  const dateParam = request.nextUrl.searchParams.get('date')
  if ((type === 'attendees-summary' || type === 'attendees-summary-by-questionnaire') && dateParam) {
    url += `&date=${dateParam}`
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Project-UUID': actualEventUuid,
      }
    })

    if (!response.ok) {
      console.error('Export error, status:', response.status, 'URL:', url)
      return new NextResponse('Error exporting file', { status: response.status })
    }

    // Forward the file response back to the client
    const headers = new Headers(response.headers)
    return new NextResponse(response.body, {
      status: response.status,
      headers
    })
  } catch (error) {
    console.error('Error fetching export:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
