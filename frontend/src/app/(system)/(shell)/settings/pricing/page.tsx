'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { usePricingSettings, useUpdatePricingSettings } from '@/hooks/system/usePricingSettings'

const ALL_CURRENCIES = ['USD', 'EUR', 'CAD', 'GBP', 'EGP', 'AED', 'KWD', 'BHD', 'SAR']

interface FormState {
  base_30: number
  base_45: number
  base_60: number
  sibling_default_discount_pct: number
  supported_currencies: string[]
  public_site_currency: string
  public_site_visible: boolean
}

export default function PricingSettingsPage() {
  const { data: settings, isLoading } = usePricingSettings()
  const { mutateAsync, isPending } = useUpdatePricingSettings()

  const [form, setForm] = useState<FormState>({
    base_30: 25,
    base_45: 35,
    base_60: 50,
    sibling_default_discount_pct: 20,
    supported_currencies: ['USD', 'EUR', 'EGP'],
    public_site_currency: 'USD',
    public_site_visible: true,
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (settings) {
      setForm({
        base_30: settings.base_30 / 100,
        base_45: settings.base_45 / 100,
        base_60: settings.base_60 / 100,
        sibling_default_discount_pct: settings.sibling_default_discount_pct,
        supported_currencies: settings.supported_currencies ?? ['USD', 'EUR', 'EGP'],
        public_site_currency: settings.public_site_currency ?? 'USD',
        public_site_visible: settings.public_site_visible ?? true,
      })
    }
  }, [settings])

  const toggleCurrency = (cur: string) => {
    setForm(f => ({
      ...f,
      supported_currencies: f.supported_currencies.includes(cur)
        ? f.supported_currencies.filter(c => c !== cur)
        : [...f.supported_currencies, cur],
    }))
  }

  const save = async () => {
    setMessage(null)
    try {
      await mutateAsync({
        base_30: Math.round(form.base_30 * 100),
        base_45: Math.round(form.base_45 * 100),
        base_60: Math.round(form.base_60 * 100),
        sibling_default_discount_pct: form.sibling_default_discount_pct,
        supported_currencies: form.supported_currencies,
        public_site_currency: form.public_site_currency,
        public_site_visible: form.public_site_visible,
      })
      setMessage({ type: 'success', text: 'Pricing settings saved.' })
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save.' })
    }
  }

  if (isLoading) {
    return <div className="py-20 text-center text-sm opacity-40">Loading…</div>
  }

  return (
    <>
      <PageHeader
        title="Pricing"
        description="Base prices, discounts, and public website currency settings."
      />
      <div className="max-w-2xl space-y-8">
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}

        {/* Base prices */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Base prices (EGP per month, 8 sessions)</h3>
          <p className="text-xs text-gray-400 mb-4">
            Stored as minor units internally. Enter the human-readable price (e.g. 25 = EGP 25.00).
          </p>
          <div className="space-y-3">
            {([30, 45, 60] as const).map(dur => (
              <div key={dur} className="flex items-center gap-3">
                <label className="w-32 text-sm text-gray-600">{dur}-min sessions</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={(form as unknown as Record<string, number>)[`base_${dur}`]}
                    onChange={e =>
                      setForm(f => ({ ...f, [`base_${dur}`]: Number(e.target.value) }))
                    }
                    className="w-28 rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  />
                  <span className="text-sm text-gray-400">EGP / mo</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sibling discount */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Default sibling discount</h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={form.sibling_default_discount_pct}
              onChange={e =>
                setForm(f => ({ ...f, sibling_default_discount_pct: Number(e.target.value) }))
              }
              className="w-20 rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </section>

        {/* Supported currencies */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Supported currencies</h3>
          <p className="text-xs text-gray-400 mb-3">
            Currencies available when billing individual students.
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_CURRENCIES.map(cur => (
              <button
                key={cur}
                type="button"
                onClick={() => toggleCurrency(cur)}
                className={`rounded-lg px-3 py-1 text-xs font-medium border transition-colors ${
                  form.supported_currencies.includes(cur)
                    ? 'text-white border-transparent'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                style={
                  form.supported_currencies.includes(cur)
                    ? { background: 'rgb(14 124 90)', borderColor: 'rgb(14 124 90)' }
                    : {}
                }
              >
                {cur}
              </button>
            ))}
          </div>
        </section>

        {/* Public website */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Public website</h3>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.public_site_visible}
              onChange={e => setForm(f => ({ ...f, public_site_visible: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Show pricing on public website</span>
          </label>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Display currency</label>
            <select
              value={form.public_site_currency}
              onChange={e => setForm(f => ({ ...f, public_site_currency: e.target.value }))}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
            >
              {(form.supported_currencies.length > 0 ? form.supported_currencies : ALL_CURRENCIES).map(cur => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>
          </div>
        </section>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: 'rgb(14 124 90)' }}
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </>
  )
}
