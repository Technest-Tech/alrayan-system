'use client'
import { useState } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, UserCog } from 'lucide-react'
import { TeacherForm, type TeacherFormValues } from './TeacherForm'
import { api } from '@/lib/system/api'
import { ApiError } from '@/lib/system/api'

interface AddTeacherDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function AddTeacherDialog({ open, onOpenChange }: AddTeacherDialogProps) {
  const qc = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(data: TeacherFormValues) {
    setIsLoading(true)
    try {
      await api('/teachers', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Teacher created.')
      qc.invalidateQueries({ queryKey: ['system', 'teachers'] })
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create teacher.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-[rgb(11,31,58)]/40 backdrop-blur-sm
            data-open:animate-in data-open:fade-in-0
            data-closed:animate-out data-closed:fade-out-0 duration-200"
        />
        <DialogPrimitive.Popup
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          style={{ outline: 'none' }}
        >
          <div
            className="relative pointer-events-auto w-full max-w-2xl max-h-[94vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'rgb(var(--surface-bg,244 246 250))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-6 py-4 border-b shrink-0"
              style={{ background: '#fff', borderColor: 'rgb(var(--border-default,229 233 240))' }}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ background: 'rgb(14 124 90 / 0.1)' }}
              >
                <UserCog size={16} style={{ color: 'rgb(14 124 90)' }} />
              </div>
              <div>
                <DialogPrimitive.Title className="font-semibold text-[rgb(11,31,58)] leading-none">
                  Add Teacher
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs mt-0.5" style={{ color: 'rgb(90 100 112)' }}>
                  Create a new teacher profile and invite them to the platform.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                className="ml-auto p-1.5 rounded-lg hover:bg-black/5 transition-colors opacity-50 hover:opacity-100"
                aria-label="Close"
              >
                <X size={16} />
              </DialogPrimitive.Close>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <TeacherForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
