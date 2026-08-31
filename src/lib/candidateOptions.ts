// The one list of industries. Every screen that offers a choice — the
// candidate's own profile, the admin add/import/edit panels, the home page,
// browse — reads it from here. A second copy anywhere means two screens can
// offer different words for the same thing, and matching compares these values
// literally, so a drifted variant silently stops matching.
//
// "Information Technology" used to be here alongside "Technology & Software".
// They mean the same thing, so candidates split across two buckets and neither
// filter found all of them. The taxonomy still maps the old value onto
// "Technology & Software" for anyone already stored under it.

export const INDUSTRIES = [
  'Accounting & Finance', 'Administrative & Office Support', 'Arts & Creative',
  'Construction & Engineering', 'Customer Service', 'Data & Analytics',
  'Education & Training', 'Engineering', 'Healthcare & Medical',
  'Hospitality & Travel', 'Human Resources',
  'Insurance', 'Legal & Compliance', 'Logistics & Supply Chain',
  'Manufacturing & Operations', 'Marketing & Advertising', 'Media & Communications',
  'Nonprofit & Social Services', 'Real Estate', 'Retail & E-commerce',
  'Sales & Business Development', 'Technology & Software', 'Other',
] as const

export const EMPLOYMENT_TYPES = ['Full Time', 'Part Time', 'Contract'] as const

// Candidates and the admin edit panel had different wording for the same
// degrees, so a value a candidate saved ("Bachelor's Degree") wasn't an option
// in the admin dropdown — it rendered blank there and could be wiped on save.
// This takes the candidates' wording, which is what is actually stored, and
// keeps the trade option the admin list added.
export const EDUCATION_LEVELS = [
  'High School / GED', 'Some College', "Associate's Degree", "Bachelor's Degree",
  "Master's Degree", 'Doctorate / PhD', 'Professional Degree (JD, MD, etc.)',
  'Trade / Vocational', 'Other',
] as const

export const EXPERIENCE_LEVELS = [
  'Less than 1 year', '1–2 years', '3–5 years', '6–10 years', '10+ years',
] as const
