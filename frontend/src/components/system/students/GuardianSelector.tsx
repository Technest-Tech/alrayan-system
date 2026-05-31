'use client'
import { useEffect, useState } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { CheckCircle2, Loader2, UserRound, PlusCircle } from 'lucide-react'
import { WhatsAppInput } from './WhatsAppInput'
import { useSearchGuardians } from '@/hooks/system/useGuardians'
import type { Guardian } from '@/types/system/guardian'

const STATUS_COLOUR: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  trial:     'bg-blue-100 text-blue-700',
  paused:    'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
  cancelled: 'bg-zinc-100 text-zinc-500',
}

interface GuardianSelectorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>
  syncDialCode?: string
}

const inp      = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)] transition-shadow'
const inpStyle = { borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fff' }

export function GuardianSelector({ control, setValue, syncDialCode }: GuardianSelectorProps) {
  const [waValue, setWaValue]               = useState('')
  const [debouncedWa, setDebouncedWa]       = useState('')
  const [linkedGuardian, setLinkedGuardian] = useState<Guardian | null>(null)
  const [forceNew, setForceNew]             = useState(false)
  const [inputKey, setInputKey]             = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedWa(waValue.trim()), 450)
    return () => clearTimeout(t)
  }, [waValue])

  const { data: results = [], isFetching } = useSearchGuardians(debouncedWa)

  const suggestion: Guardian | null =
    !forceNew && results.length === 1 && !linkedGuardian ? results[0] : null

  function handleWaChange(fullNumber: string) {
    setWaValue(fullNumber)
    setForceNew(false)
    setLinkedGuardian(null)
    setValue('guardian_whatsapp', fullNumber, { shouldValidate: true })
    setValue('guardian_id', undefined)
  }

  function linkGuardian(g: Guardian) {
    setLinkedGuardian(g)
    setValue('guardian_id', g.id, { shouldValidate: true })
    setValue('guardian_whatsapp', g.whatsapp, { shouldValidate: true })
    setValue('guardian_name', g.name, { shouldValidate: true })
  }

  function unlinkGuardian() {
    setLinkedGuardian(null)
    setForceNew(true)
    setWaValue('')
    setInputKey(k => k + 1)
    setValue('guardian_id', undefined)
    setValue('guardian_whatsapp', '')
    setValue('guardian_name', '')
  }

  return (
    <div className="space-y-3">

      {/* ── Linked guardian confirmed view ── */}
      {linkedGuardian ? (
        <div
          className="flex items-start gap-3 p-3 rounded-xl border"
          style={{ borderColor: 'rgb(14 124 90 / 0.3)', background: 'rgb(14 124 90 / 0.04)' }}
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: 'rgb(14 124 90)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{linkedGuardian.name}</p>
            <p className="text-xs opacity-60">{linkedGuardian.whatsapp}</p>
            {linkedGuardian.students.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {linkedGuardian.students.map(s => (
                  <span
                    key={s.id}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLOUR[s.status] ?? 'bg-zinc-100 text-zinc-600'}`}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={unlinkGuardian}
            className="text-xs opacity-40 hover:opacity-100 underline shrink-0"
          >
            change
          </button>
        </div>
      ) : (
        <>
          {/* ── Parent WhatsApp — identical to adult WhatsApp field ── */}
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-70">
              Parent WhatsApp <span className="text-red-500">*</span>
            </label>
            <WhatsAppInput
              key={inputKey}
              value={waValue}
              onChange={handleWaChange}
              syncDialCode={syncDialCode}
              inputStyle={inpStyle}
            />
            {isFetching && (
              <p className="flex items-center gap-1.5 text-[11px] opacity-40 mt-1.5">
                <Loader2 size={11} className="animate-spin" />
                Searching…
              </p>
            )}
          </div>

          {/* ── Single match suggestion ── */}
          {suggestion && (
            <div
              className="rounded-xl border p-3 space-y-2"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))', background: '#fafafa' }}
            >
              <p className="text-[11px] font-semibold opacity-40 uppercase tracking-widest">Existing parent found</p>
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{ background: 'rgb(14 124 90 / 0.08)' }}
                >
                  <UserRound size={14} style={{ color: 'rgb(14 124 90)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{suggestion.name}</p>
                  <p className="text-xs opacity-50">{suggestion.whatsapp}</p>
                  {suggestion.students.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {suggestion.students.map(s => (
                        <span
                          key={s.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLOUR[s.status] ?? 'bg-zinc-100 text-zinc-600'}`}
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => linkGuardian(suggestion)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: 'rgb(14 124 90)' }}
                >
                  <CheckCircle2 size={12} />
                  Use this parent
                </button>
                <button
                  type="button"
                  onClick={() => setForceNew(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-black/5 transition-colors"
                  style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
                >
                  <PlusCircle size={12} />
                  Create new instead
                </button>
              </div>
            </div>
          )}

          {/* ── Multiple matches list ── */}
          {!forceNew && results.length > 1 && (
            <div
              className="rounded-xl border divide-y text-sm"
              style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}
            >
              {results.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => linkGuardian(g)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-black/[0.03] transition-colors text-left"
                >
                  <UserRound size={14} className="opacity-40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{g.name}</span>
                    <span className="ml-2 text-xs opacity-50">{g.whatsapp}</span>
                  </div>
                  {g.students.length > 0 && (
                    <span className="text-[11px] opacity-40">{g.students.length} child(ren)</span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setForceNew(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-black/[0.03] transition-colors text-left text-xs opacity-50"
              >
                <PlusCircle size={13} />
                Create new parent
              </button>
            </div>
          )}

          {/* ── Parent name (shown when no match or user chose new) ── */}
          {(forceNew || (debouncedWa.length >= 5 && results.length === 0 && !isFetching)) && (
            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-70">
                Parent name <span className="text-red-500">*</span>
              </label>
              <Controller
                name="guardian_name"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <input
                      type="text"
                      className={inp}
                      style={inpStyle}
                      placeholder="e.g. Ahmed Khalid"
                      {...field}
                      value={field.value ?? ''}
                    />
                    {fieldState.error && (
                      <p className="text-red-500 text-[11px] mt-1">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
