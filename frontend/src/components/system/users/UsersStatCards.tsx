'use client'
import { Users, GraduationCap, UserCog, Baby, CheckCircle2, MinusCircle, Ban, Archive } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'
import type { UserStats } from '@/types/system/user-directory'

interface Props {
  stats?: UserStats
  loading?: boolean
}

export function UsersStatCards({ stats, loading }: Props) {
  const { t } = useI18n()

  const CARDS: { key: keyof UserStats; label: string; icon: React.ReactNode; accent: string }[] = [
    { key: 'total',     label: t('users.statTotalUsers'), icon: <Users size={15} />,        accent: 'rgb(30 90 171)' },
    { key: 'students',  label: t('users.statStudents'),   icon: <GraduationCap size={15} />, accent: 'rgb(124 58 237)' },
    { key: 'teachers',  label: t('users.statTeachers'),   icon: <UserCog size={15} />,      accent: 'rgb(14 124 90)' },
    { key: 'parents',   label: t('users.statParents'),    icon: <Baby size={15} />,         accent: 'rgb(190 24 93)' },
    { key: 'active',    label: t('users.statActive'),     icon: <CheckCircle2 size={15} />, accent: 'rgb(14 124 90)' },
    { key: 'inactive',  label: t('users.statNonActive'),  icon: <MinusCircle size={15} />,  accent: 'rgb(180 83 9)' },
    { key: 'suspended', label: t('users.statSuspended'),  icon: <Ban size={15} />,          accent: 'rgb(166 39 30)' },
    { key: 'archived',  label: t('users.statArchived'),   icon: <Archive size={15} />,      accent: 'rgb(90 100 112)' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {CARDS.map((c) => (
        <div
          key={c.key}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border"
          style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
        >
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
            style={{ background: `color-mix(in srgb, ${c.accent} 12%, transparent)`, color: c.accent }}
          >
            {c.icon}
          </div>
          <div className="min-w-0">
            {loading ? (
              <div className="h-6 w-10 rounded bg-black/5 animate-pulse" />
            ) : (
              <p className="text-xl font-semibold leading-none tabular-nums" style={{ color: 'rgb(11 31 58)' }}>
                {stats?.[c.key] ?? 0}
              </p>
            )}
            <p className="text-xs mt-1 truncate" style={{ color: 'rgb(90 100 112)' }}>{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
