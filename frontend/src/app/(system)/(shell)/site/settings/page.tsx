'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Mail, Phone, MapPin, MessageCircle, Link2 } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSiteSettings, useUpdateSiteSettings, type SiteSettings } from '@/hooks/system/useSiteSettings'

const CARD = 'rounded-2xl border border-border-soft bg-white p-5 sm:p-6 space-y-4'

const CONTACT_FIELDS = [
  { key: 'site.contact_email', label: 'Email', icon: Mail, placeholder: 'hello@example.com' },
  { key: 'site.contact_phone', label: 'Phone', icon: Phone, placeholder: '+20 100 000 0000' },
  { key: 'site.contact_whatsapp', label: 'WhatsApp number', icon: MessageCircle, placeholder: '201000000000 (digits only)' },
  { key: 'site.contact_address', label: 'Address', icon: MapPin, placeholder: 'Online — worldwide' },
] as const

const SOCIAL_FIELDS = [
  { key: 'site.social_facebook', label: 'Facebook', icon: Link2 },
  { key: 'site.social_instagram', label: 'Instagram', icon: Link2 },
  { key: 'site.social_youtube', label: 'YouTube', icon: Link2 },
  { key: 'site.social_twitter', label: 'X / Twitter', icon: Link2 },
  { key: 'site.social_tiktok', label: 'TikTok', icon: Link2 },
  { key: 'site.social_telegram', label: 'Telegram', icon: Link2 },
] as const

export default function SiteSettingsPage() {
  const { data, isLoading } = useSiteSettings()
  const save = useUpdateSiteSettings()
  const [form, setForm] = useState<SiteSettings>({})

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await save.mutateAsync(form)
      toast.success('Site settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <>
      <PageHeader
        title="Site Settings"
        description="Contact details and social links shown on the public website."
      />

      {isLoading ? (
        <p className="text-sm text-muted-text">Loading…</p>
      ) : (
        <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
          <div className={CARD}>
            <h2 className="font-semibold">Contact details</h2>
            {CONTACT_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="flex items-center gap-1.5 text-xs">
                  <f.icon className="size-3.5 text-secondary" aria-hidden="true" /> {f.label}
                </Label>
                <Input
                  value={form[f.key] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className={CARD}>
            <h2 className="font-semibold">Social links</h2>
            <p className="text-xs text-muted-text -mt-2">Leave blank to hide an icon on the site.</p>
            {SOCIAL_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="flex items-center gap-1.5 text-xs">
                  <f.icon className="size-3.5 text-secondary" aria-hidden="true" /> {f.label}
                </Label>
                <Input
                  type="url"
                  value={form[f.key] ?? ''}
                  placeholder="https://…"
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <Button type="submit" disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            Save settings
          </Button>
        </form>
      )}
    </>
  )
}
