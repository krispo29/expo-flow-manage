import { z } from 'zod'

// Participant validation schemas
export const createParticipantSchema = z.object({
  event_uuid: z.string().uuid('Invalid event UUID'),
  title: z.string().max(50).optional(),
  title_other: z.string().max(50).optional(),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  company_name: z.string().max(255).optional(),
  job_position: z.string().max(100).optional(),
  residence_country: z.string().length(2).optional(),
  mobile_country_code: z.string().max(5).optional(),
  mobile_number: z.string().max(20).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  invitation_code: z.string().max(50).optional(),
  attendee_type_code: z.string().length(2, 'Attendee type must be 2 characters'),
})

export const updateParticipantSchema = createParticipantSchema.partial().extend({
  registration_uuid: z.string().uuid('Invalid registration UUID'),
})

// Exhibitor validation schemas
export const createExhibitorSchema = z.object({
  eventId: z.string().uuid('Invalid event UUID'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  companyName: z.string().min(1, 'Company name is required').max(255),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  country: z.string().length(2).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().max(30).optional(),
  fax: z.string().max(30).optional(),
  contactPerson: z.string().max(100).optional(),
  email: z.string().email('Invalid email address'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  boothNo: z.string().max(20).optional(),
  quota: z.number().int().min(0).optional(),
  overQuota: z.number().int().min(0).optional(),
})

export const updateExhibitorSchema = createExhibitorSchema.partial().extend({
  exhibitorUuid: z.string().uuid('Invalid exhibitor UUID'),
})

// Staff/Member validation schemas
export const createStaffSchema = z.object({
  exhibitorId: z.string().uuid('Invalid exhibitor UUID'),
  title: z.string().max(50).optional(),
  title_other: z.string().max(50).optional(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  position: z.string().max(100).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  mobile: z.string().max(20).optional(),
  companyName: z.string().max(255).optional(),
  companyCountry: z.string().length(2).optional(),
  companyTel: z.string().max(30).optional(),
})

export const updateStaffSchema = createStaffSchema.partial().extend({
  memberUuid: z.string().uuid('Invalid member UUID'),
})

// Organizer validation schemas
export const createOrganizerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  full_name: z.string().min(1, 'Full name is required').max(200),
})

export const updateOrganizerSchema = z.object({
  organizer_uuid: z.string().uuid('Invalid organizer UUID'),
  full_name: z.string().min(1).max(200),
  is_active: z.boolean(),
})

// Password reset schema
export const passwordResetSchema = z.object({
  organizer_uuid: z.string().uuid('Invalid organizer UUID'),
  new_password: z.string().min(6, 'Password must be at least 6 characters').max(100),
})

// Conference validation schemas
export const createConferenceSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500),
  date: z.string().datetime(), // ISO date string
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
  room: z.string().max(100).optional(),
  capacity: z.number().int().min(1).optional(),
  detail: z.string().max(2000).optional(),
  speakerInfo: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  showOnReg: z.boolean().optional(),
  allowPreReg: z.boolean().optional(),
})

// Helper function to validate form data
export function validateFormData<T>(schema: z.ZodSchema<T>, formData: FormData): { 
  success: boolean 
  data?: T 
  errors?: Record<string, string> 
} {
  const data: Record<string, unknown> = {}
  
  // Convert FormData to object
  for (const [key, value] of formData.entries()) {
    // Handle checkboxes and boolean values
    if (value === 'true') data[key] = true
    else if (value === 'false') data[key] = false
    else if (value === '') data[key] = undefined
    else data[key] = value
  }
  
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const errors: Record<string, string> = {}
    
    // Zod's safeParse returns a SafeParseReturnType which has an error of type ZodError
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.')
      errors[path] = issue.message
    })
    
    return { success: false, errors }
  }
  
  return { success: true, data: result.data }
}
