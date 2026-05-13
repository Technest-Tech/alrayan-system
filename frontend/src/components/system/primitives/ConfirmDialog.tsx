'use client'
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  variant?: 'danger' | 'default'
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

interface DialogState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      setDialog({ ...options, resolve })
    })
  }, [])

  function handleClose(result: boolean) {
    dialog?.resolve(result)
    setDialog(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => handleClose(false)} />
          <div
            className="relative w-full max-w-md rounded-2xl shadow-2xl p-6"
            style={{ background: 'rgb(var(--surface-card, 255 255 255))' }}
          >
            <button onClick={() => handleClose(false)} className="absolute top-4 right-4 opacity-40 hover:opacity-70">
              <X size={16} />
            </button>

            <div className="flex items-start gap-4">
              {dialog.variant === 'danger' && (
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-red-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold">{dialog.title}</h3>
                {dialog.description && (
                  <p className="mt-1 text-sm opacity-60">{dialog.description}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-black/5"
                style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleClose(true)}
                className={[
                  'px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors',
                  dialog.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[rgb(14,124,90)] hover:bg-[rgb(12,108,78)]',
                ].join(' ')}
              >
                {dialog.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}
