export type Role = 'candidate' | 'employer' | 'admin'

export type CandidateStatus = 'active' | 'inactive' | 'placed'

export interface Profile {
  id: string
  email: string
  role: Role
  full_name: string | null
  created_at: string
}

export interface CandidateProfile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  location: string | null
  current_job_title: string | null
  education_level: string | null
  years_experience: string | null
  fields_worked_in: string[]
  tools_software: string | null
  languages: string | null
  roles_seeking: string | null
  employment_type: string[]
  desired_salary: string | null
  currency: string | null
  us_hours_comfortable: boolean | null
  remote_experience: boolean | null
  resume_url: string | null
  screening_booked: boolean
  screening_booked_at: string | null
  status: CandidateStatus
  admin_tags: string[]
  updated_at: string
}
