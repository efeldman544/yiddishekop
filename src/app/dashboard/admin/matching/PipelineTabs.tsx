'use client'

import Link from 'next/link'

export default function PipelineTabs({ activeTab }: { activeTab: 'pipeline' | 'meetings' }) {
  return (
    <div className="px-8 pt-6 pb-0 flex items-center gap-1 border-b border-gray-100 shrink-0">
      <Link
        href="/dashboard/admin/matching"
        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
          activeTab === 'pipeline'
            ? 'border-indigo-600 text-indigo-700'
            : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
        }`}
      >
        Matching
      </Link>
      <Link
        href="/dashboard/admin/matching?tab=meetings"
        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
          activeTab === 'meetings'
            ? 'border-indigo-600 text-indigo-700'
            : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
        }`}
      >
        Meetings
      </Link>
    </div>
  )
}
