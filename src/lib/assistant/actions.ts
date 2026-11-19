import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { INDUSTRIES } from '@/lib/candidateOptions'
import { upsertCandidate } from '@/lib/candidateCreate'
import { resumesUrl, serviceClient, stagedExists, stagedPath } from '@/lib/assistant/storage'

// SERVER ONLY.
//
// Changes the assistant can make — never on its own say-so. When the model
// asks for one, the chat shows the admin a card saying exactly what will
// happen, written here from the real records ("Change Yossi Stern's status
// from active to placed"), not from the model's own description of it. Only
// a click on Confirm runs it. Nothing here deletes anything or contacts a
// candidate.

type Tool = Anthropic.Beta.BetaTool
type ToolResult = Anthropic.Beta.BetaToolResultBlockParam

const CANDIDATE_STATUSES = ['pending', 'active', 'inactive', 'placed']
const JOB_STATUSES = ['New', 'Open', 'On Hold', 'Filled', 'Closed']
const EMPLOYMENT = ['Full Time', 'Part Time', 'Contract']

const text = (description: string) => ({ type: 'string', description })

export const ACTION_TOOLS: Tool[] = [
  {
    name: 'set_candidate_status',
    description: 'Change a profile candidate\'s status. "active" lists them for employers to browse; "pending", "inactive" and "placed" do not.',
    input_schema: {
      type: 'object', additionalProperties: false, required: ['candidate_id', 'status'],
      properties: { candidate_id: { type: 'string' }, status: { type: 'string', enum: CANDIDATE_STATUSES } },
    },
  },
  {
    name: 'set_interviewed',
    description: 'Mark a profile candidate as interviewed by us, or not.',
    input_schema: {
      type: 'object', additionalProperties: false, required: ['candidate_id', 'interviewed'],
      properties: { candidate_id: { type: 'string' }, interviewed: { type: 'boolean' } },
    },
  },
  {
    name: 'update_industry_tags',
    description: 'Add and/or remove the admin\'s industry tags on a profile candidate.',
    input_schema: {
      type: 'object', additionalProperties: false, required: ['candidate_id', 'add', 'remove'],
      properties: {
        candidate_id: { type: 'string' },
        add: { type: 'array', items: { type: 'string', enum: [...INDUSTRIES] } },
        remove: { type: 'array', items: { type: 'string', enum: [...INDUSTRIES] } },
      },
    },
  },
  {
    name: 'assign_to_job',
    description: 'Put a candidate forward for a job. The job\'s employer is notified and sees the candidate in their portal.',
    input_schema: {
      type: 'object', additionalProperties: false, required: ['candidate_id', 'kind', 'job_id'],
      properties: { candidate_id: { type: 'string' }, kind: { type: 'string', enum: ['profile', 'video'] }, job_id: { type: 'string' } },
    },
  },
  {
    name: 'unassign_from_job',
    description: 'Take a candidate off a job they were assigned to.',
    input_schema: {
      type: 'object', additionalProperties: false, required: ['candidate_id', 'job_id'],
      properties: { candidate_id: { type: 'string' }, job_id: { type: 'string' } },
    },
  },
  {
    name: 'assign_to_employer',
    description: 'Share a candidate directly with an employer account, without a particular job. The employer is notified.',
    input_schema: {
      type: 'object', additionalProperties: false, required: ['candidate_id', 'kind', 'employer_id'],
      properties: { candidate_id: { type: 'string' }, kind: { type: 'string', enum: ['profile', 'video'] }, employer_id: { type: 'string' } },
    },
  },
  {
    name: 'create_job',
    description: 'Add a job to the job board. Use "" for anything not given; employer_id is an employer account id from search, or "".',
    input_schema: {
      type: 'object', additionalProperties: false,
      required: ['job_title', 'company_name', 'employer_id', 'status', 'employment_type', 'description', 'salary', 'hours', 'languages'],
      properties: {
        job_title: { type: 'string' }, company_name: { type: 'string' }, employer_id: { type: 'string' },
        status: { type: 'string', enum: JOB_STATUSES },
        employment_type: { type: 'string', enum: ['', ...EMPLOYMENT] },
        description: { type: 'string' }, salary: { type: 'string' }, hours: { type: 'string' }, languages: { type: 'string' },
      },
    },
  },
  {
    name: 'create_candidate',
    description:
      'Add a new candidate, usually from an attached résumé (read it first with read_attached_file and fill these from it). '
      + 'Name and email are required — if the résumé has no email, ask the admin for it instead of inventing one. '
      + 'Use "" or [] for anything not known. resume_file_id is the attached file\'s id, or "".',
    input_schema: {
      type: 'object', additionalProperties: false,
      required: ['full_name', 'email', 'phone', 'whatsapp', 'location', 'current_job_title', 'years_experience',
        'fields_worked_in', 'employment_type', 'languages', 'tools_software', 'roles_seeking', 'resume_file_id'],
      properties: {
        full_name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, whatsapp: { type: 'string' },
        location: text('City, country'), current_job_title: { type: 'string' }, years_experience: text('e.g. "3-5 years"'),
        fields_worked_in: { type: 'array', items: { type: 'string', enum: [...INDUSTRIES] } },
        employment_type: { type: 'array', items: { type: 'string', enum: EMPLOYMENT } },
        languages: { type: 'string' }, tools_software: { type: 'string' }, roles_seeking: { type: 'string' },
        resume_file_id: { type: 'string' },
      },
    },
  },
  {
    name: 'attach_resume',
    description: 'Put a résumé attached in this chat on an existing candidate\'s profile, replacing any résumé they have.',
    input_schema: {
      type: 'object', additionalProperties: false, required: ['candidate_id', 'file_id'],
      properties: { candidate_id: { type: 'string' }, file_id: { type: 'string' } },
    },
  },
]

// Not marked strict: every input is checked by previewAction before the
// admin sees a card, and again before it runs, so a malformed one can only
// produce a card that says it can't be done.
const ACTION_NAME_SET = new Set(ACTION_TOOLS.map(t => t.name))
export function isAction(name: string): boolean { return ACTION_NAME_SET.has(name) }

/** What the confirm card says. `error` means it can't be done as asked; the card offers only Dismiss. */
export type Preview = { title: string; lines: string[]; warning?: string; error?: string }

/** Follow-ups the chat page does after an action succeeds. */
export type Effects = {
  /** Tell the employer, as the rest of the app does after an assignment. */
  notify?: { candidate_id: string; job_id: string } | { candidate_id: string; employer_id: string }
  /** Rebuild this candidate's summary card from their new résumé. */
  refreshCard?: string
}

type Call = { id: string; name: string; input: unknown }
type Ctx = { db: SupabaseClient }

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const list = (v: unknown) => (Array.isArray(v) ? v.map(x => String(x).trim()).filter(Boolean) : [])
const fileName = (path: string) => path.split('/').pop() ?? 'file'

async function candidateName(db: SupabaseClient, id: string, kind: 'profile' | 'video' = 'profile') {
  if (!id) return null
  if (kind === 'video') {
    const { data } = await db.from('video_candidates').select('name').eq('id', id).maybeSingle()
    return (data as { name?: string | null } | null)?.name ?? null
  }
  const { data } = await db.from('candidate_profiles').select('full_name').eq('id', id).maybeSingle()
  return (data as { full_name?: string | null } | null)?.full_name ?? null
}

async function profile(db: SupabaseClient, id: string) {
  if (!id) return null
  const { data } = await db.from('candidate_profiles').select('id, full_name, status, interviewed, admin_tags, resume_url').eq('id', id).maybeSingle()
  return data as { id: string; full_name: string | null; status: string | null; interviewed: boolean | null; admin_tags: string[] | null; resume_url: string | null } | null
}

async function job(db: SupabaseClient, id: string) {
  if (!id) return null
  const { data } = await db.from('job_requirements').select('id, job_title, company_name, employer_id').eq('id', id).maybeSingle()
  return data as { id: string; job_title: string | null; company_name: string | null; employer_id: string | null } | null
}

async function employerName(db: SupabaseClient, id: string) {
  if (!id) return null
  const { data } = await db.from('profiles').select('full_name, email, role').eq('id', id).maybeSingle()
  const p = data as { full_name?: string | null; email?: string | null; role?: string } | null
  return p && p.role === 'employer' ? (p.full_name || p.email || 'this employer') : null
}

const jobLabel = (j: { job_title: string | null; company_name: string | null }) =>
  `${j.job_title ?? 'Untitled job'}${j.company_name ? ` at ${j.company_name}` : ''}`

/** The confirm card for one action, from the records as they are now. */
export async function previewAction(ctx: Ctx, call: Call): Promise<Preview> {
  const i = (call.input ?? {}) as Record<string, unknown>
  const { db } = ctx
  try {
    switch (call.name) {
      case 'set_candidate_status': {
        const p = await profile(db, s(i.candidate_id))
        if (!p) return { title: 'Change status', lines: [], error: 'That candidate wasn’t found.' }
        const to = s(i.status)
        if (p.status === to) return { title: 'Change status', lines: [], error: `${p.full_name} is already ${to}.` }
        return {
          title: 'Change status',
          lines: [`Change **${p.full_name}**’s status from ${p.status ?? 'none'} to **${to}**.`],
          warning: to === 'active' ? 'Employers will be able to find them on Browse.' : p.status === 'active' ? 'They will stop being listed for employers.' : undefined,
        }
      }
      case 'set_interviewed': {
        const p = await profile(db, s(i.candidate_id))
        if (!p) return { title: 'Interviewed', lines: [], error: 'That candidate wasn’t found.' }
        const to = i.interviewed === true
        if (!!p.interviewed === to) return { title: 'Interviewed', lines: [], error: `${p.full_name} is already marked as ${to ? '' : 'not '}interviewed.` }
        return { title: 'Interviewed', lines: [`Mark **${p.full_name}** as ${to ? '**interviewed**' : '**not interviewed**'}.`] }
      }
      case 'update_industry_tags': {
        const p = await profile(db, s(i.candidate_id))
        if (!p) return { title: 'Industry tags', lines: [], error: 'That candidate wasn’t found.' }
        const now = p.admin_tags ?? []
        const add = list(i.add).filter(t => !now.includes(t))
        const remove = list(i.remove).filter(t => now.includes(t))
        if (!add.length && !remove.length) return { title: 'Industry tags', lines: [], error: 'Those tags are already set that way.' }
        return {
          title: 'Industry tags',
          lines: [
            `On **${p.full_name}**:`,
            ...(add.length ? [`Add: ${add.join(', ')}`] : []),
            ...(remove.length ? [`Remove: ${remove.join(', ')}`] : []),
          ],
        }
      }
      case 'assign_to_job': {
        const kind = i.kind === 'video' ? 'video' : 'profile'
        const [name, j, { data: existing }] = await Promise.all([
          candidateName(db, s(i.candidate_id), kind), job(db, s(i.job_id)),
          db.from('candidate_job_assignments').select('id').eq('candidate_id', s(i.candidate_id)).eq('job_id', s(i.job_id)).maybeSingle(),
        ])
        if (!name) return { title: 'Assign to job', lines: [], error: 'That candidate wasn’t found.' }
        if (!j) return { title: 'Assign to job', lines: [], error: 'That job wasn’t found.' }
        if (existing) return { title: 'Assign to job', lines: [], error: `${name} is already assigned to ${jobLabel(j)}.` }
        const employer = j.employer_id ? await employerName(db, j.employer_id) : null
        return {
          title: 'Assign to job',
          lines: [`Put **${name}** forward for **${jobLabel(j)}**.`],
          warning: employer ? `${employer} will be notified and see them in their portal.` : 'This job has no employer account, so nobody is notified.',
        }
      }
      case 'unassign_from_job': {
        const [name, j, { data: existing }] = await Promise.all([
          candidateName(db, s(i.candidate_id)).then(n => n ?? candidateName(db, s(i.candidate_id), 'video')), job(db, s(i.job_id)),
          db.from('candidate_job_assignments').select('id').eq('candidate_id', s(i.candidate_id)).eq('job_id', s(i.job_id)).maybeSingle(),
        ])
        if (!j) return { title: 'Remove from job', lines: [], error: 'That job wasn’t found.' }
        if (!existing) return { title: 'Remove from job', lines: [], error: `${name ?? 'That candidate'} isn’t assigned to ${jobLabel(j)}.` }
        return { title: 'Remove from job', lines: [`Take **${name ?? 'this candidate'}** off **${jobLabel(j)}**.`], warning: 'The employer will no longer see them for this job.' }
      }
      case 'assign_to_employer': {
        const kind = i.kind === 'video' ? 'video' : 'profile'
        const [name, employer, { data: existing }] = await Promise.all([
          candidateName(db, s(i.candidate_id), kind), employerName(db, s(i.employer_id)),
          db.from('employer_candidate_assignments').select('employer_id').eq('candidate_id', s(i.candidate_id)).eq('employer_id', s(i.employer_id)).maybeSingle(),
        ])
        if (!name) return { title: 'Share with employer', lines: [], error: 'That candidate wasn’t found.' }
        if (!employer) return { title: 'Share with employer', lines: [], error: 'That employer account wasn’t found.' }
        if (existing) return { title: 'Share with employer', lines: [], error: `${name} is already shared with ${employer}.` }
        return { title: 'Share with employer', lines: [`Share **${name}** with **${employer}**.`], warning: `${employer} will be notified and see them in their portal.` }
      }
      case 'create_job': {
        if (!s(i.job_title)) return { title: 'New job', lines: [], error: 'A job needs a title.' }
        const employer = s(i.employer_id) ? await employerName(db, s(i.employer_id)) : null
        if (s(i.employer_id) && !employer) return { title: 'New job', lines: [], error: 'That employer account wasn’t found.' }
        return {
          title: 'New job',
          lines: [
            `**${s(i.job_title)}**${s(i.company_name) ? ` at ${s(i.company_name)}` : ''}`,
            `Status: ${s(i.status) || 'Open'}${s(i.employment_type) ? ` · ${s(i.employment_type)}` : ''}`,
            ...(employer ? [`Employer account: ${employer}`] : []),
            ...(s(i.salary) ? [`Pay: ${s(i.salary)}`] : []),
            ...(s(i.hours) ? [`Hours: ${s(i.hours)}`] : []),
            ...(s(i.description) ? [`Description: ${s(i.description).slice(0, 300)}${s(i.description).length > 300 ? '…' : ''}`] : []),
          ],
        }
      }
      case 'create_candidate': {
        const name = s(i.full_name), email = s(i.email).toLowerCase()
        if (!name || !email) return { title: 'New candidate', lines: [], error: 'A candidate needs a name and an email address.' }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { title: 'New candidate', lines: [], error: `“${email}” isn’t an email address.` }
        const file = s(i.resume_file_id)
        if (file && !(stagedPath(file) && await stagedExists(file))) return { title: 'New candidate', lines: [], error: 'That résumé isn’t a file attached in this chat (or it has already been used).' }
        const { data: existing } = await db.from('profiles').select('role').ilike('email', email).maybeSingle()
        const role = (existing as { role?: string } | null)?.role
        if (role && role !== 'candidate') return { title: 'New candidate', lines: [], error: `${email} already belongs to ${role === 'admin' ? 'an admin' : `an ${role}`} account.` }
        const field = (label: string, v: unknown) => (Array.isArray(v) ? (v.length ? `${label}: ${v.join(', ')}` : null) : s(v) ? `${label}: ${s(v)}` : null)
        return {
          title: 'New candidate',
          lines: [
            `**${name}** · ${email}`,
            ...[field('Phone', i.phone), field('WhatsApp', i.whatsapp), field('Location', i.location),
              field('Current title', i.current_job_title), field('Experience', i.years_experience),
              field('Industries', i.fields_worked_in), field('Looking for', i.employment_type),
              field('Languages', i.languages), field('Tools', i.tools_software), field('Roles sought', i.roles_seeking),
              file ? `Résumé: ${fileName(file)}` : 'No résumé'].filter((x): x is string => !!x),
          ],
          warning: role === 'candidate'
            ? 'There is already a candidate with this email — their profile will be updated with these details instead.'
            : 'They’ll be added as active, so employers can find them on Browse. No email is sent to them.',
        }
      }
      case 'attach_resume': {
        const p = await profile(db, s(i.candidate_id))
        const file = stagedPath(i.file_id)
        if (!p) return { title: 'Add résumé', lines: [], error: 'That candidate wasn’t found.' }
        if (!file || !(await stagedExists(file))) return { title: 'Add résumé', lines: [], error: 'That isn’t a file attached in this chat (or it has already been used).' }
        return {
          title: 'Add résumé',
          lines: [`Put **${fileName(file)}** on **${p.full_name}**’s profile.`],
          warning: p.resume_url ? 'It replaces the résumé they have now.' : undefined,
        }
      }
      default:
        return { title: call.name, lines: [], error: 'The assistant asked for something it can’t do.' }
    }
  } catch (e) {
    console.error(`assistant preview ${call.name} failed:`, e)
    return { title: call.name, lines: [], error: 'Couldn’t check this against the records. Try again.' }
  }
}

/** Run one action the admin confirmed. Never throws; the result goes back to the model either way. */
export async function runAction(ctx: Ctx, call: Call): Promise<{ result: ToolResult; effects: Effects }> {
  const i = (call.input ?? {}) as Record<string, unknown>
  const { db } = ctx
  const done = (message: string, effects: Effects = {}) => ({ result: { type: 'tool_result' as const, tool_use_id: call.id, content: message }, effects })
  const failed = (message: string) => ({ result: { type: 'tool_result' as const, tool_use_id: call.id, content: message, is_error: true }, effects: {} })

  // Checked again at the moment of running: the records may have changed
  // since the card was shown.
  const preview = await previewAction(ctx, call)
  if (preview.error) return failed(`Not done: ${preview.error}`)

  try {
    switch (call.name) {
      case 'set_candidate_status': {
        const { error } = await db.from('candidate_profiles').update({ status: s(i.status) }).eq('id', s(i.candidate_id))
        return error ? failed(`Not done: ${error.message}`) : done(`Done. Status is now ${s(i.status)}.`)
      }
      case 'set_interviewed': {
        const on = i.interviewed === true
        const { error } = await db.from('candidate_profiles')
          .update({ interviewed: on, interviewed_at: on ? new Date().toISOString() : null }).eq('id', s(i.candidate_id))
        return error ? failed(`Not done: ${error.message}`) : done(`Done. Marked as ${on ? '' : 'not '}interviewed.`)
      }
      case 'update_industry_tags': {
        const p = await profile(db, s(i.candidate_id))
        const remove = new Set(list(i.remove))
        const tags = [...new Set([...(p?.admin_tags ?? []).filter(t => !remove.has(t)), ...list(i.add)])]
        const { error } = await db.from('candidate_profiles').update({ admin_tags: tags }).eq('id', s(i.candidate_id))
        return error ? failed(`Not done: ${error.message}`) : done(`Done. Tags are now: ${tags.join(', ') || 'none'}.`)
      }
      case 'assign_to_job': {
        const { error } = await db.from('candidate_job_assignments').insert({ candidate_id: s(i.candidate_id), job_id: s(i.job_id) })
        return error ? failed(`Not done: ${error.message}`)
          : done('Done. Assigned; the employer is being notified.', { notify: { candidate_id: s(i.candidate_id), job_id: s(i.job_id) } })
      }
      case 'unassign_from_job': {
        const { error } = await db.from('candidate_job_assignments').delete().eq('candidate_id', s(i.candidate_id)).eq('job_id', s(i.job_id))
        return error ? failed(`Not done: ${error.message}`) : done('Done. Taken off the job.')
      }
      case 'assign_to_employer': {
        const { error } = await db.from('employer_candidate_assignments').insert({ employer_id: s(i.employer_id), candidate_id: s(i.candidate_id) })
        return error ? failed(`Not done: ${error.message}`)
          : done('Done. Shared; the employer is being notified.', { notify: { candidate_id: s(i.candidate_id), employer_id: s(i.employer_id) } })
      }
      case 'create_job': {
        const { data, error } = await db.from('job_requirements').insert({
          job_title: s(i.job_title), company_name: s(i.company_name) || null, employer_id: s(i.employer_id) || null,
          status: s(i.status) || 'Open', employment_type: s(i.employment_type) || null, description: s(i.description) || null,
          salary: s(i.salary) || null, hours: s(i.hours) || null, languages: s(i.languages) || null,
          updated_at: new Date().toISOString(),
        }).select('id').single()
        return error ? failed(`Not done: ${error.message}`) : done(`Done. Job created with id ${(data as { id: string }).id}.`)
      }
      case 'create_candidate': {
        const service = serviceClient()
        const created = await upsertCandidate(service, {
          full_name: i.full_name, email: i.email, phone: i.phone, whatsapp: i.whatsapp, location: i.location,
          current_job_title: i.current_job_title, years_experience: i.years_experience,
          fields_worked_in: i.fields_worked_in, employment_type: i.employment_type,
          languages: i.languages, tools_software: i.tools_software, roles_seeking: i.roles_seeking,
        })
        if ('error' in created) return failed(`Not done: ${created.error}`)
        const file = stagedPath(i.resume_file_id)
        if (!file) return done(`Done. ${created.isNew ? 'Candidate added' : 'Existing candidate updated'} with id ${created.id} (no résumé).`)
        const moved = await moveResume(service, file, created.id)
        return moved
          ? done(`Done. ${created.isNew ? 'Candidate added' : 'Existing candidate updated'} with id ${created.id}, résumé attached.`, { refreshCard: created.id })
          : done(`Candidate ${created.isNew ? 'added' : 'updated'} with id ${created.id}, but the résumé couldn't be attached — upload it from their page.`)
      }
      case 'attach_resume': {
        const file = stagedPath(i.file_id)!
        const ok = await moveResume(serviceClient(), file, s(i.candidate_id))
        return ok ? done('Done. Résumé attached; their summary card is being rebuilt.', { refreshCard: s(i.candidate_id) }) : failed('Not done: the résumé couldn’t be moved onto their profile.')
      }
      default:
        return failed('There is no such action.')
    }
  } catch (e) {
    console.error(`assistant action ${call.name} failed:`, e)
    return failed(`Not done: ${e instanceof Error ? e.message : String(e)}`)
  }
}

/** Move an attached file onto a candidate, where their résumé lives, and point their profile at it. */
async function moveResume(service: SupabaseClient, staged: string, candidateId: string): Promise<boolean> {
  const bucket = service.storage.from('resumes')
  const { data: blob, error: downloadError } = await bucket.download(staged)
  if (downloadError || !blob) return false
  const dest = `${candidateId}/${fileName(staged)}`
  const { error: uploadError } = await bucket.upload(dest, await blob.arrayBuffer(), { contentType: blob.type || 'application/octet-stream', upsert: true })
  if (uploadError) return false
  const { error } = await service.from('candidate_profiles').update({ resume_url: resumesUrl(dest), updated_at: new Date().toISOString() }).eq('id', candidateId)
  if (error) return false
  await bucket.remove([staged])
  return true
}
