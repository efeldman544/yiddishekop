// A glyph per industry, so a tag is recognisable at a glance rather than a
// word to read. Keyed by the canonical category names in candidateOptions —
// anything unrecognised falls back to a neutral tag shape rather than an empty
// space, so the row of tags never goes ragged.

const PATHS: Record<string, React.ReactNode> = {
  'Accounting & Finance': (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h3" />
    </>
  ),
  'Administrative & Office Support': (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3h6v3H9z" />
      <path d="M9 11h6M9 15h4" />
    </>
  ),
  'Arts & Creative': (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-1.4 1-2 2-2H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9Z" />
      <circle cx="8" cy="11" r="1" />
      <circle cx="12" cy="8" r="1" />
      <circle cx="16" cy="11" r="1" />
    </>
  ),
  'Construction & Engineering': (
    <>
      <path d="M3 18h18" />
      <path d="M5 18v-4a7 7 0 0 1 14 0v4" />
      <path d="M10 7V4h4v3" />
    </>
  ),
  'Customer Service': (
    <>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="2" y="13" width="4" height="6" rx="1.5" />
      <rect x="18" y="13" width="4" height="6" rx="1.5" />
      <path d="M20 19v1a3 3 0 0 1-3 3h-3" />
    </>
  ),
  'Data & Analytics': (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  'Education & Training': (
    <>
      <path d="M12 4 2 9l10 5 10-5-10-5Z" />
      <path d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
    </>
  ),
  'Engineering': (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
  'Healthcare & Medical': (
    <>
      <path d="M20.8 6.6a5 5 0 0 0-8.8-1.6 5 5 0 0 0-8.8 1.6c-1 3.3 1.8 6.6 8.8 12 7-5.4 9.8-8.7 8.8-12Z" />
    </>
  ),
  'Hospitality & Travel': (
    <>
      <path d="M2 12h20l-3.5 4H8l-2-4" />
      <path d="M6 12 4 6l3 1 2 5" />
      <path d="M4 20h16" />
    </>
  ),
  'Human Resources': (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.9" />
      <path d="M17.5 14.3A6 6 0 0 1 21 20" />
    </>
  ),
  'Insurance': (
    <>
      <path d="M12 3 4 6v6c0 4.4 3.4 8.3 8 9 4.6-.7 8-4.6 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  'Legal & Compliance': (
    <>
      <path d="M12 3v18M7 21h10" />
      <path d="M4 8h16" />
      <path d="M6.5 8 4 14h5l-2.5-6ZM17.5 8 15 14h5l-2.5-6Z" />
    </>
  ),
  'Logistics & Supply Chain': (
    <>
      <rect x="1" y="6" width="13" height="10" rx="1.5" />
      <path d="M14 10h4l3 3v3h-7" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  'Manufacturing & Operations': (
    <>
      <path d="M3 20V10l5 3V10l5 3V10l5 3v7H3Z" />
      <path d="M3 20h18" />
    </>
  ),
  'Marketing & Advertising': (
    <>
      <path d="M4 9v6h3l7 4V5L7 9H4Z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
    </>
  ),
  'Media & Communications': (
    <>
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z" />
    </>
  ),
  'Nonprofit & Social Services': (
    <>
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" />
    </>
  ),
  'Real Estate': (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  'Retail & E-commerce': (
    <>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  'Sales & Business Development': (
    <>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  'Technology & Software': (
    <>
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
    </>
  ),
}

const FALLBACK = (
  <>
    <path d="M3 8.5 11 3l10 3.5-3 11L9 21 3 8.5Z" />
    <circle cx="14" cy="8.5" r="1.2" />
  </>
)

export default function IndustryIcon({ industry, className }: { industry: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[industry] ?? FALLBACK}
    </svg>
  )
}
