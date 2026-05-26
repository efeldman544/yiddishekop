#!/usr/bin/env node
// Usage:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-candidates.mjs path/to/candidates.csv

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  process.exit(1)
}

const CSV_PATH = process.argv[2]
if (!CSV_PATH) {
  console.error('Usage: node scripts/import-candidates.mjs <path-to-csv>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Field transformers ──────────────────────────────────────────────────────

function mapEducation(val) {
  if (!val) return null
  const v = val.trim()
  if (/high school/i.test(v)) return 'High School / GED'
  if (/some college/i.test(v)) return 'Some College'
  if (/associate/i.test(v)) return "Associate's Degree"
  if (/bachelor/i.test(v)) return "Bachelor's Degree"
  if (/master/i.test(v)) return "Master's Degree"
  if (/doctorate|phd/i.test(v)) return 'Doctorate / PhD'
  if (/professional|jd|md/i.test(v)) return 'Professional Degree (JD, MD, etc.)'
  return v
}

function mapExperience(val) {
  if (!val) return null
  const v = val.trim()
  // Normalize common variations to the app's enum values
  if (/less than 1|^0/i.test(v)) return 'Less than 1 year'
  if (/^1[^0-9]|1[-–]2/i.test(v)) return '1–2 years'
  if (/2[-–]4|^2 year/i.test(v)) return '1–2 years'
  if (/3[-–]5|^3 year|^4 year|^5 year/i.test(v)) return '3–5 years'
  if (/5[-–]7|^6 year|^7 year/i.test(v)) return '6–10 years'
  if (/6[-–]10|^8\+|8 year|^9 year/i.test(v)) return '6–10 years'
  if (/10\+|more than 10/i.test(v)) return '10+ years'
  return v
}

function mapFields(val) {
  if (!val) return []
  return val.split(';').map(s => {
    const clean = s.trim()
    if (clean.toLowerCase().startsWith('other::')) return 'Other'
    return clean
  }).filter(Boolean)
}

function mapEmploymentType(val) {
  if (!val) return []
  return val.split(';').map(s => {
    const clean = s.trim().toLowerCase()
    if (clean.includes('full')) return 'Full Time'
    if (clean.includes('part')) return 'Part Time'
    return null
  }).filter(Boolean)
}

function mapBool(val) {
  if (!val) return null
  return val.trim().toLowerCase().startsWith('yes')
}

function buildSalary(amount, per) {
  if (!amount?.trim()) return null
  const p = (per || '').trim().toLowerCase()
  if (p === 'hour') return `${amount.trim()}/hour`
  if (p === 'year') return `${amount.trim()}/year`
  return amount.trim()
}

function normalizeCurrency(val) {
  if (!val) return null
  const v = val.trim()
  if (/usd|us\s*\$|\$\s*\(us|dollar/i.test(v)) return 'USD'
  if (/ils|shekel/i.test(v)) return 'ILS'
  return v
}

// ── Main ────────────────────────────────────────────────────────────────────

const content = readFileSync(CSV_PATH, ‘utf-8’).replace(/^﻿/, ‘’) // strip BOM
const rawRows = parse(content, { columns: true, skip_empty_lines: true, trim: true })

// Build a key resolver that finds columns by normalized substring (handles curly quotes)
// Pass exact:true for short/ambiguous column names to require full match
function makeResolver(row) {
  const keys = Object.keys(row)
  const norm = (s) => s.replace(/[‘’]/g, “’”).replace(/[“”]/g, ‘”’).toLowerCase().trim()
  return (fragment, exact = false) => {
    const nf = norm(fragment)
    const key = exact
      ? keys.find(k => norm(k) === nf)
      : keys.find(k => norm(k).includes(nf))
    return key ? row[key] : undefined
  }
}

const rows = rawRows

// Deduplicate by email — keep first (most recent) occurrence
const seen = new Set()
const deduped = []
for (const row of rows) {
  const email = makeResolver(row)('Email Address')?.trim().toLowerCase()
  if (!email || seen.has(email)) continue
  seen.add(email)
  deduped.push(row)
}

const dupes = rows.length - deduped.length
console.log(`\n📋 ${rows.length} rows → ${deduped.length} unique emails (${dupes} duplicates removed)\n`)

let created = 0
let skipped = 0
let errors = 0

for (let i = 0; i < deduped.length; i++) {
  const row = deduped[i]
  const g = makeResolver(row)
  const email = g('Email Address')?.trim()
  const fullName = g('Full Name')?.trim() || null

  if (!email) {
    console.warn(`[${i + 1}/${deduped.length}] SKIP — no email`)
    skipped++
    continue
  }

  // Create auth user (confirmed, no password — candidates use "forgot password" to activate)
  const { data: userData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'candidate' },
  })

  if (authError) {
    if (/already registered|already been registered/i.test(authError.message)) {
      console.log(`[${i + 1}/${deduped.length}] SKIP  ${email} (already exists)`)
      skipped++
      continue
    }
    console.error(`[${i + 1}/${deduped.length}] ERROR ${email}: ${authError.message}`)
    errors++
    continue
  }

  const userId = userData.user.id

  const { error: profileError } = await supabase.from('candidate_profiles').upsert({
    id: userId,
    full_name: fullName,
    email,
    phone: g('Phone Number') || null,
    whatsapp: g('Whatsapp Phone Number') || null,
    location: g('Current Location') || null,
    current_job_title: g('Current Job Title') || null,
    education_level: mapEducation(g('Highest Level of Education')),
    years_experience: mapExperience(g('Years of Professional Experience')),
    fields_worked_in: mapFields(g('Industries You')),
    tools_software: g('Tools or Software') || null,
    languages: g('Languages You Speak') || null,
    roles_seeking: g('types of roles') || null,
    employment_type: mapEmploymentType(g('Employment Type')),
    desired_salary: buildSalary(g('Desired Salary'), g('Per', true)),
    currency: normalizeCurrency(g('Currency', true)),
    us_hours_comfortable: mapBool(g('comfortable working across')),
    remote_experience: mapBool(g('worked remotely')),
    resume_url: g('upload resume') || null,
    status: 'active',
    updated_at: new Date().toISOString(),
  })

  if (profileError) {
    console.error(`[${i + 1}/${deduped.length}] PROFILE ERROR ${email}: ${profileError.message}`)
    errors++
  } else {
    console.log(`[${i + 1}/${deduped.length}] OK    ${email}`)
    created++
  }

  // Pause every 20 to stay within Supabase rate limits
  if ((i + 1) % 20 === 0) await new Promise(r => setTimeout(r, 500))
}

console.log(`\n✅ Done: ${created} imported, ${skipped} skipped, ${errors} errors\n`)
