'use client'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/system/i18n'

// With fallbacks: sheets render in a portal, outside the scope that defines these tokens.
const fieldStyle = {
  borderColor: 'rgb(var(--border-default, 229 233 240))',
  background:  'rgb(var(--surface-card, 255 255 255))',
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
      {hint && <span className="block mt-1 text-xs opacity-50">{hint}</span>}
    </label>
  )
}

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      {...props}
      className={cn('w-full rounded-xl border px-3 py-2 text-sm disabled:opacity-50', className)}
      style={fieldStyle}
    />
  )
}

export function SelectInput({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select
      {...props}
      className={cn('w-full rounded-xl border px-3 py-2 text-sm disabled:opacity-50', className)}
      style={fieldStyle}
    >
      {children}
    </select>
  )
}

export function TextAreaInput({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      {...props}
      className={cn('w-full rounded-xl border px-3 py-2 text-sm', className)}
      style={fieldStyle}
    />
  )
}

export function SimplePager({ page, lastPage, onPage }: { page: number; lastPage: number; onPage: (page: number) => void }) {
  const { t } = useI18n()
  if (lastPage <= 1) return null

  return (
    <div className="flex items-center justify-end gap-3 mt-3 text-sm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
        style={{ borderColor: 'rgb(var(--border-default))' }}
      >
        {t('common.prev')}
      </button>
      <span className="opacity-60 tabular-nums">{page} / {lastPage}</span>
      <button
        type="button"
        disabled={page >= lastPage}
        onClick={() => onPage(page + 1)}
        className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
        style={{ borderColor: 'rgb(var(--border-default))' }}
      >
        {t('common.next')}
      </button>
    </div>
  )
}
