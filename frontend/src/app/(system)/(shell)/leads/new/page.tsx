'use client'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateLead } from '@/hooks/system/useLeads'
import { useState } from 'react'
import { useI18n } from '@/lib/system/i18n'

export default function NewLeadPage() {
  const { t } = useI18n()
  const router = useRouter()
  const create = useCreateLead()
  const [form, setForm] = useState({ name: '', email: '', phone: '', whatsapp: '', country: '', source: 'manual_entry' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const lead = await create.mutateAsync(form)
    router.push(`/leads/${lead.id}`)
  }

  return (
    <>
      <PageHeader title={t('leads.newLeadTitle')} description={t('leads.newLeadDescription')}>
        <LinkButton variant="ghost" href="/leads">← {t('common.back')}</LinkButton>
      </PageHeader>
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>{t('common.name')} *</Label>
            <Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('common.email')}</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>{t('leads.fieldPhone')}</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('common.whatsapp')}</Label>
              <Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>{t('leads.fieldCountryCode')}</Label>
              <Input maxLength={2} value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value.toUpperCase() }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('leads.fieldSource')} *</Label>
            <Select value={form.source} onValueChange={(v: string) => setForm(p => ({ ...p, source: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="google_ads">{t('leads.sourceGoogleAds')}</SelectItem>
                <SelectItem value="facebook_ads">{t('leads.sourceFacebookAds')}</SelectItem>
                <SelectItem value="instagram_ads">{t('leads.sourceInstagramAds')}</SelectItem>
                <SelectItem value="whatsapp_direct">{t('leads.sourceWhatsappDirect')}</SelectItem>
                <SelectItem value="student_referral">{t('leads.sourceStudentReferral')}</SelectItem>
                <SelectItem value="website_form">{t('leads.sourceWebsiteForm')}</SelectItem>
                <SelectItem value="manual_entry">{t('leads.sourceManualEntry')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? t('common.creating') : t('leads.createLeadButton')}
          </Button>
        </form>
      </div>
    </>
  )
}
