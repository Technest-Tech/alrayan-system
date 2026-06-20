'use client'
import { useState, useEffect } from 'react'
import { Building2, Phone, Globe, CheckCircle2 } from 'lucide-react'
import { TimezoneSelect } from '@/components/system/primitives/TimezoneSelect'
import { useAcademy, useUpdateAcademy, type AcademySettings } from '@/hooks/system/useAcademy'
import { useI18n } from '@/lib/system/i18n'

const BORDER = 'rgb(var(--border-default, 229 233 240))'
const CARD = 'rgb(var(--surface-card, 255 255 255))'
const ACCENT = 'rgb(var(--accent))'

interface Field {
  key: keyof AcademySettings
  labelKey: string
  type?: string
  required?: boolean
  placeholder?: string
  full?: boolean
}

interface Group {
  titleKey: string
  descriptionKey: string
  icon: React.ReactNode
  fields: Field[]
}

const GROUPS: Group[] = [
  {
    titleKey: 'settings.general.identity',
    descriptionKey: 'settings.general.identityDesc',
    icon: <Building2 size={18} />,
    fields: [
      { key: 'academy.name', labelKey: 'settings.general.academyName', required: true, full: true },
      { key: 'academy.footer_text', labelKey: 'settings.general.footerText', full: true },
    ],
  },
  {
    titleKey: 'settings.general.contact',
    descriptionKey: 'settings.general.contactDesc',
    icon: <Phone size={18} />,
    fields: [
      { key: 'academy.support_email', labelKey: 'settings.general.supportEmail', type: 'email' },
      { key: 'academy.support_phone', labelKey: 'settings.general.supportPhone' },
      { key: 'academy.support_whatsapp', labelKey: 'settings.general.whatsappNumber' },
      { key: 'academy.address', labelKey: 'settings.general.address', full: true },
    ],
  },
]

export function GeneralSettingsSection() {
  const { t } = useI18n()
  const { data: settings, isLoading } = useAcademy()
  const { mutateAsync, isPending } = useUpdateAcademy()
  const [form, setForm] = useState<Partial<AcademySettings>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const set = (k: keyof AcademySettings, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await mutateAsync(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {GROUPS.map(group => (
        <section
          key={group.titleKey}
          className="rounded-2xl p-6"
          style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: '0 1px 2px rgb(11 31 58 / 0.04)' }}
        >
          <div className="flex items-start gap-3 mb-5">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{ background: 'rgb(var(--accent) / 0.10)', color: ACCENT }}
            >
              {group.icon}
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'rgb(15 23 42)' }}>
                {t(group.titleKey)}
              </h3>
              <p className="text-xs mt-0.5 opacity-55">{t(group.descriptionKey)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {group.fields.map(f => (
              <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium mb-1.5">
                  {t(f.labelKey)}
                  {f.required && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type={f.type ?? 'text'}
                  required={f.required}
                  value={(form[f.key] as string) ?? ''}
                  onChange={e => set(f.key, e.target.value)}
                  disabled={isLoading}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] transition-shadow disabled:opacity-40"
                  style={{ borderColor: BORDER, background: CARD }}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Localization */}
      <section
        className="rounded-2xl p-6"
        style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: '0 1px 2px rgb(11 31 58 / 0.04)' }}
      >
        <div className="flex items-start gap-3 mb-5">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{ background: 'rgb(var(--accent) / 0.10)', color: ACCENT }}
          >
            <Globe size={18} />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: 'rgb(15 23 42)' }}>
              {t('settings.general.localization')}
            </h3>
            <p className="text-xs mt-0.5 opacity-55">{t('settings.general.localizationDesc')}</p>
          </div>
        </div>

        <div className="max-w-xs">
          <label className="block text-sm font-medium mb-1.5">
            {t('settings.general.defaultTimezone')}<span className="text-red-500"> *</span>
          </label>
          <TimezoneSelect
            value={(form['academy.default_timezone'] as string) ?? ''}
            onChange={tz => set('academy.default_timezone', tz)}
            disabled={isLoading}
          />
        </div>
      </section>

      {/* Save bar */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending || isLoading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
          style={{ background: ACCENT }}
        >
          {isPending ? t('common.saving') : t('settings.general.saveSettings')}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <CheckCircle2 size={16} /> {t('settings.general.saved')}
          </span>
        )}
      </div>
    </form>
  )
}
