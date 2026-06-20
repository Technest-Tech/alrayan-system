'use client'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'rgb(var(--surface-card, 255 255 255))' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 border-b"
          style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
        >
          <span className="text-sm opacity-40">⌘</span>
          <input
            ref={inputRef}
            type="text"
            placeholder={t('commandPalette.placeholder')}
            className="flex-1 py-4 bg-transparent text-sm outline-none placeholder:opacity-40"
          />
          <button onClick={onClose} className="opacity-40 hover:opacity-70 transition-opacity">
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-8 text-center text-sm opacity-40">
          {t('commandPalette.empty')}
        </div>
      </div>
    </div>
  )
}
