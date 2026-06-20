'use client'
import { useI18n } from '@/lib/system/i18n'

interface Props {
  allTypes: Record<string, string[]>
  mutedTypes: string[]
  onChange: (muted: string[]) => void
}

export function PreferenceMatrix({ allTypes, mutedTypes, onChange }: Props) {
  const { t } = useI18n()

  const toggle = (type: string) => {
    onChange(
      mutedTypes.includes(type)
        ? mutedTypes.filter(x => x !== type)
        : [...mutedTypes, type]
    )
  }

  const groups = Object.entries(allTypes)

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('notifications.preferences.empty')}</p>
  }

  return (
    <div className="space-y-5">
      {groups.map(([group, types]) => (
        <div key={group}>
          <h3 className="text-sm font-medium capitalize mb-2">{group.replace(/_/g, ' ')}</h3>
          <div className="space-y-2">
            {types.map(type => {
              const enabled = !mutedTypes.includes(type)
              return (
                <label key={type} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggle(type)}
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                  />
                  <span className="text-sm font-mono text-muted-foreground">{type}</span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
