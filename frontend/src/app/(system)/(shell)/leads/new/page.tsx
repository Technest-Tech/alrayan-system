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

export default function NewLeadPage() {
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
      <PageHeader title="New lead" description="Manually create a lead for inbound WhatsApp or referral enquiries.">
        <LinkButton variant="ghost" href="/leads">← Back</LinkButton>
      </PageHeader>
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Country (2-letter code)</Label>
              <Input maxLength={2} value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value.toUpperCase() }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Source *</Label>
            <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="google_ads">Google Ads</SelectItem>
                <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                <SelectItem value="instagram_ads">Instagram Ads</SelectItem>
                <SelectItem value="whatsapp_direct">WhatsApp Direct</SelectItem>
                <SelectItem value="student_referral">Student Referral</SelectItem>
                <SelectItem value="website_form">Website Form</SelectItem>
                <SelectItem value="manual_entry">Manual Entry</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create lead'}
          </Button>
        </form>
      </div>
    </>
  )
}
