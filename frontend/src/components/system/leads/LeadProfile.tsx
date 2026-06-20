'use client'
import type { LeadDetail } from '@/types/system/lead'
import { useMarkLeadLost, useAssignLead } from '@/hooks/system/useLeads'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { useState } from 'react'
import { MarkLostDialog } from './MarkLostDialog'
import Link from 'next/link'
import { useI18n } from '@/lib/system/i18n'

export function LeadProfile({ lead }: { lead: LeadDetail }) {
  const { t } = useI18n()
  const [lostOpen, setLostOpen] = useState(false)
  const assign = useAssignLead(lead.id)

  return (
    <div className="space-y-6">
      {/* Contact */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <div className="text-muted-foreground">{t('common.email')}</div>
        <div>{lead.email ?? '—'}</div>
        <div className="text-muted-foreground">{t('leads.fieldPhone')}</div>
        <div>{lead.phone ?? '—'}</div>
        <div className="text-muted-foreground">{t('common.whatsapp')}</div>
        <div>{lead.whatsapp ?? '—'}</div>
        <div className="text-muted-foreground">{t('common.country')}</div>
        <div>{lead.country ?? '—'}</div>
        <div className="text-muted-foreground">{t('leads.fieldSource')}</div>
        <div className="capitalize">{(lead.source ?? '').replace(/_/g, ' ')}{lead.source_detail ? ` — ${lead.source_detail}` : ''}</div>
        <div className="text-muted-foreground">{t('leads.fieldCourseInterest')}</div>
        <div>{lead.course_interest?.name ?? '—'}</div>
        {lead.trial_booking_id && (
          <>
            <div className="text-muted-foreground">{t('leads.fieldTrialBooking')}</div>
            <div>TB-{lead.trial_booking_id}</div>
          </>
        )}
        {lead.converted_to_student_id && (
          <>
            <div className="text-muted-foreground">{t('leads.fieldConvertedStudent')}</div>
            <div><Link href={`/students/${lead.converted_to_student_id}`} className="underline text-primary">{t('leads.viewStudentLink')}</Link></div>
          </>
        )}
      </div>

      {/* Actions */}
      {!['closed', 'lost'].includes(lead.status) && (
        <div className="flex gap-2">
          <LinkButton variant="outline" href={`/students/new?lead=${lead.id}`}>{t('leads.convertToStudent')}</LinkButton>
          <Button variant="ghost" className="text-destructive" onClick={() => setLostOpen(true)}>
            {t('leads.markLostShort')}
          </Button>
        </div>
      )}

      <MarkLostDialog open={lostOpen} onClose={() => setLostOpen(false)} leadId={lead.id} />
    </div>
  )
}
