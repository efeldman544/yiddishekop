// Shared so the admin candidate list, the add/import panel, and the edit panel
// all write the exact same category strings — matching and industry filters
// compare these values literally, so a typo'd variant silently stops matching.

export const INDUSTRIES = [
  'Accounting & Finance', 'Administrative & Office Support', 'Arts & Creative',
  'Construction & Engineering', 'Customer Service', 'Data & Analytics',
  'Education & Training', 'Engineering', 'Healthcare & Medical',
  'Hospitality & Travel', 'Human Resources', 'Information Technology',
  'Insurance', 'Legal & Compliance', 'Logistics & Supply Chain',
  'Manufacturing & Operations', 'Marketing & Advertising', 'Media & Communications',
  'Nonprofit & Social Services', 'Real Estate', 'Retail & E-commerce',
  'Sales & Business Development', 'Technology & Software', 'Other',
] as const

export const EMPLOYMENT_TYPES = ['Full Time', 'Part Time', 'Contract'] as const

export const EDUCATION_LEVELS = [
  'High School / GED', 'Some College', 'Associate Degree',
  'Bachelor Degree', 'Master Degree', 'Doctorate', 'Trade / Vocational', 'Other',
] as const

export const EXPERIENCE_LEVELS = [
  'Less than 1 year', '1–2 years', '3–5 years', '6–10 years', '10+ years',
] as const
