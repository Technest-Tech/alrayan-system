'use client'
import { PERMISSION_GROUPS } from '@/lib/system/permissions'
import { useI18n } from '@/lib/system/i18n'

interface Props {
  selected:  string[]
  onChange:  (perms: string[]) => void
  disabled?: boolean
}

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((p) => p !== value) : [...arr, value]
}

export function PermissionMatrix({ selected, onChange, disabled }: Props) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      {Object.entries(PERMISSION_GROUPS).map(([group, actions]) => (
        <div key={group}>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1.5">
            {t(`users.permGroup.${group}`)}
          </p>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const perm    = `${group}.${action}`
              const checked = selected.includes(perm)
              return (
                <label
                  key={perm}
                  className={[
                    'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border cursor-pointer select-none transition-colors',
                    checked
                      ? 'border-[rgb(14,124,90)] bg-[rgb(14,124,90)]/10 text-[rgb(14,124,90)]'
                      : 'border-transparent bg-black/5 opacity-60 hover:opacity-80',
                    disabled ? 'cursor-not-allowed opacity-40' : '',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onChange(toggle(selected, perm))}
                  />
                  <span>{t(`users.permAction.${action}`)}</span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
