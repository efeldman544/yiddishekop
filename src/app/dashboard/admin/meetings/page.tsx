import MeetingsClient from './MeetingsClient'

// Meetings used to be a tab inside Matching, which only ever fitted half of
// what is on it. Matching is about putting a candidate in front of an
// employer, and the interviews that come out of that do belong to it — but
// screening calls are between us and a candidate, before any employer is
// involved, and had nothing to do with matching at all. It is its own section
// now, with the two kinds named separately on the page.
export default function AdminMeetingsPage() {
  return (
    <main className="px-8 py-6">
      <h1 className="page-title mb-1">Meetings</h1>
      <p className="text-sm text-gray-500 mb-6">
        Screening calls between us and candidates, and interviews between employers and candidates.
      </p>
      <MeetingsClient />
    </main>
  )
}
