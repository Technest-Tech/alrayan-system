'use client'
import type { Control } from 'react-hook-form'
import { Controller } from 'react-hook-form'

interface ParentGuardianFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
}

const inputCls   = 'w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]'
const inputStyle = { borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }

const FIELDS = [
  { name: 'parent_name',      label: 'Parent / Guardian name',    type: 'text'  },
  { name: 'parent_phone',     label: 'Parent phone',              type: 'tel'   },
  { name: 'parent_whatsapp',  label: 'Parent WhatsApp',           type: 'tel'   },
  { name: 'parent_email',     label: 'Parent email',              type: 'email' },
] as const

export function ParentGuardianFields({ control }: ParentGuardianFieldsProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold opacity-60 uppercase tracking-wide">Parent / Guardian</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <div key={f.name}>
            <label className="block text-sm font-medium mb-1.5">{f.label}</label>
            <Controller
              name={f.name}
              control={control}
              render={({ field }) => (
                <input
                  type={f.type}
                  className={inputCls}
                  style={inputStyle}
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
          </div>
        ))}
      </div>
    </fieldset>
  )
}
