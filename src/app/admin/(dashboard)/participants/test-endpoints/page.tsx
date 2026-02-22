'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  getParticipants, 
  getParticipantById, 
  createParticipant, 
  updateParticipant, 
  deleteParticipant,
  resendEmailConfirmation,
  getMyReservations,
  reserveConference,
  cancelConferenceReservation,
  getAllAttendeeTypes,
  searchParticipantByCode,
  importParticipants
} from '@/app/actions/participant'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function TestEndpointsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [projectId] = useState('horti-agri')
  
  // Test data
  const [participantId, setParticipantId] = useState('98a1728a-fc04-41e6-8a95-13c959ebaa4d')
  const [conferenceId, setConferenceId] = useState('f92489be-30d1-4673-aba4-74789fdc7329')
  const [searchCode, setSearchCode] = useState('EX210031006')

  async function testEndpoint(name: string, fn: () => Promise<any>) {
    setLoading(true)
    setResult(null)
    try {
      const res = await fn()
      setResult({ endpoint: name, success: true, data: res })
      toast.success(`${name} - Success`)
    } catch (error: any) {
      setResult({ endpoint: name, success: false, error: error.message })
      toast.error(`${name} - Failed`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Participant API Endpoints Test</h1>
        <p className="text-muted-foreground">Test all 12 participant endpoints</p>
      </div>

      <div className="grid gap-4">
        {/* Test Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Test Parameters</CardTitle>
            <CardDescription>Configure test data for endpoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Participant UUID</Label>
                <Input 
                  value={participantId} 
                  onChange={(e) => setParticipantId(e.target.value)}
                  placeholder="registration_uuid"
                />
              </div>
              <div className="space-y-2">
                <Label>Conference UUID</Label>
                <Input 
                  value={conferenceId} 
                  onChange={(e) => setConferenceId(e.target.value)}
                  placeholder="conference_uuid"
                />
              </div>
              <div className="space-y-2">
                <Label>Search Code</Label>
                <Input 
                  value={searchCode} 
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="registration_code"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoint Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* 1. Get All Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">1. Get All Participants</CardTitle>
              <CardDescription className="text-xs">GET /v1/admin/project/participants</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testEndpoint('Get All Participants', () => getParticipants(projectId))}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </CardContent>
          </Card>

          {/* 2. Get One Participant */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">2. Get One Participant</CardTitle>
              <CardDescription className="text-xs">GET /v1/admin/project/participants/:id</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testEndpoint('Get One Participant', () => getParticipantById(participantId))}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </CardContent>
          </Card>

          {/* 3. Create Participant */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">3. Create Participant</CardTitle>
              <CardDescription className="text-xs">POST /v1/admin/project/participants</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => {
                  const formData = new FormData()
                  formData.append('event_uuid', '6109decb-d4e4-44e2-bb16-22eb0548e414')
                  formData.append('title', 'Mr')
                  formData.append('first_name', 'Test')
                  formData.append('last_name', 'User')
                  formData.append('email', `test${Date.now()}@example.com`)
                  formData.append('mobile_country_code', '+66')
                  formData.append('mobile_number', '812345678')
                  formData.append('company_name', 'Test Company')
                  formData.append('job_position', 'Tester')
                  formData.append('residence_country', 'Thailand')
                  formData.append('attendee_type_code', 'VI')
                  return testEndpoint('Create Participant', () => createParticipant(formData))
                }}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </CardContent>
          </Card>

          {/* 4. Update Participant */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">4. Update Participant</CardTitle>
              <CardDescription className="text-xs">PUT /v1/admin/project/participants</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => {
                  const formData = new FormData()
                  formData.append('title', 'Mr')
                  formData.append('first_name', 'Updated')
                  formData.append('last_name', 'Name')
                  formData.append('email', 'updated@example.com')
                  formData.append('mobile_country_code', '+66')
                  formData.append('mobile_number', '899999999')
                  formData.append('company_name', 'Updated Company')
                  formData.append('job_position', 'Updated Position')
                  formData.append('residence_country', 'Thailand')
                  return testEndpoint('Update Participant', () => updateParticipant(participantId, formData))
                }}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </CardContent>
          </Card>

          {/* 5. Delete Participant */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">5. Delete Participant</CardTitle>
              <CardDescription className="text-xs">DELETE /v1/admin/project/participants/:id/delete</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testEndpoint('Delete Participant', () => deleteParticipant(participantId))}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </CardContent>
          </Card>

          {/* 6. Reserve Conference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">6. Reserve Conference</CardTitle>
              <CardDescription className="text-xs">POST /v1/admin/project/participants/reserve</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testEndpoint('Reserve Conference', () => reserveConference(conferenceId, participantId))}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </CardContent>
          </Card>

          {/* 7. Cancel Conference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">7. Cancel Conference</CardTitle>
              <CardDescription className="text-xs">POST /v1/admin/project/participants/cancel_reserve</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testEndpoint('Cancel Conference', () => cancelConferenceReservation(conferenceId, participantId))}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </CardContent>
          </Card>

          {/* 8. Resend Email */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">8. Resend Email</CardTitle>
              <CardDescription className="text-xs">POST /v1/admin/project/participants/send_email_comfirmation</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testEndpoint('Resend Email', () => resendEmailConfirmation([participantId]))}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </CardContent>
          </Card>

          {/* 9. Get My Reservations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">9. Get My Reservations</CardTitle>
              <CardDescription className="text-xs">GET /v1/admin/project/participants/:id/my-reservation</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testEndpoint('Get My Reservations', () => getMyReservations(participantId))}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </CardContent>
          </Card>

          {/* 10. Import Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">10. Import Participants</CardTitle>
              <CardDescription className="text-xs">POST /v1/admin/project/participants (bulk)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => {
                  const data = [{
                    event_uuid: '6109decb-d4e4-44e2-bb16-22eb0548e414',
                    title: 'Mr',
                    first_name: 'Bulk',
                    last_name: 'Import',
                    email: `bulk${Date.now()}@example.com`,
                    mobile_country_code: '+66',
                    mobile_number: '812345678',
                    company_name: 'Bulk Company',
                    job_position: 'Bulk Position',
                    residence_country: 'Thailand',
                    attendee_type_code: 'VI'
                  }]
                  return testEndpoint('Import Participants', () => importParticipants(data))
                }}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </CardContent>
          </Card>

          {/* 11. Get Attendee Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">11. Get Attendee Types</CardTitle>
              <CardDescription className="text-xs">GET /v1/admin/project/participants/attendee_types</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testEndpoint('Get Attendee Types', () => getAllAttendeeTypes())}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </CardContent>
          </Card>

          {/* 12. Search By Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">12. Search By Code</CardTitle>
              <CardDescription className="text-xs">GET /v1/admin/project/participants (filter)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => testEndpoint('Search By Code', () => searchParticipantByCode(searchCode))}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Result Display */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Test Result: {result.endpoint}</CardTitle>
              <CardDescription>
                Status: {result.success ? '✅ Success' : '❌ Failed'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={JSON.stringify(result, null, 2)} 
                readOnly 
                rows={20}
                className="font-mono text-xs"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
