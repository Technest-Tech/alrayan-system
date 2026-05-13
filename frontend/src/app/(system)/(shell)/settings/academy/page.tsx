'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useAcademy, useUpdateAcademy, type AcademySettings } from '@/hooks/system/useAcademy'

const FIELDS: Array<{ key: keyof AcademySettings; label: string; type?: string; required?: boolean }> = [
  { key: 'academy.name',             label: 'Academy name',       required: true },
  { key: 'academy.support_email',    label: 'Support email',      type: 'email' },
  { key: 'academy.support_phone',    label: 'Support phone' },
  { key: 'academy.support_whatsapp', label: 'WhatsApp number' },
  { key: 'academy.address',          label: 'Address' },
  { key: 'academy.default_timezone', label: 'Default timezone',   required: true },
  { key: 'academy.footer_text',      label: 'Certificate footer text' },
]

export default function AcademySettingsPage() {
  const { data: settings, isLoading } = useAcademy()
  const { mutateAsync, isPending } = useUpdateAcademy()
  const [form, setForm] = useState<Partial<AcademySettings>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const set = (k: keyof AcademySettings, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await mutateAsync(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <>
      <PageHeader title="Academy Settings" description="General academy information." />

      <form onSubmit={submit} className="mt-6 max-w-lg space-y-4">
        {FIELDS.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium mb-1">{f.label}</label>
            <input
              type={f.type ?? 'text'}
              required={f.required}
              value={(form[f.key] as string) ?? ''}
              onChange={e => set(f.key, e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border px-3 py-2 text-sm disabled:opacity-40"
              style={{ borderColor: 'rgb(var(--border-default))' }}
            />
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={isPending || isLoading}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40"
            style={{ background: 'rgb(var(--accent))' }}>
            {isPending ? 'Saving…' : 'Save settings'}
          </button>
          {saved && <span className="text-sm text-green-600">Saved.</span>}
        </div>
      </form>
    </>
  )
}
