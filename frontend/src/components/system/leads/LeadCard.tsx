import type { Lead } from '@/types/system/lead'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

const SOURCE_LABELS: Record<string, string> = {
  google_ads: 'Google', facebook_ads: 'FB', instagram_ads: 'IG',
  whatsapp_direct: 'WA', student_referral: 'Ref', website_form: 'Site', manual_entry: 'Manual',
}

export function LeadCard({ lead }: { lead: Lead }) {
  const hasDue = (lead.pending_follow_ups_count ?? 0) > 0

  return (
    <Link href={`/leads/${lead.id}`}>
      <div className="bg-card border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-medium truncate">{lead.name}</p>
          {hasDue && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1" title="Follow-up due" />}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">{SOURCE_LABELS[lead.source] ?? lead.source}</span>
          {lead.country && <span className="text-xs text-muted-foreground">{lead.country}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
        </p>
      </div>
    </Link>
  )
}
