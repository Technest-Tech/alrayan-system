'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { useInviteUser } from '@/hooks/system/useUsers'
import { PermissionMatrix } from './PermissionMatrix'
import { SUPERVISOR_DEFAULTS } from '@/lib/system/permissions'
import { ApiError } from '@/lib/system/api'

const schema = z.object({
  name:  z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  role:  z.enum(['admin', 'supervisor', 'teacher']),
})
type FormValues = z.infer<typeof schema>

interface Props {
  onClose: () => void
}

export function InviteUserSheet({ onClose }: Props) {
  const [permissions, setPermissions] = useState<string[]>([...SUPERVISOR_DEFAULTS])
  const invite = useInviteUser()

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'supervisor' },
  })

  const role = watch('role')

  async function onSubmit(values: FormValues) {
    try {
      await invite.mutateAsync({
        ...values,
        permissions: role === 'supervisor' ? permissions : [],
      })
      toast.success(`Invite sent to ${values.email}`)
      onClose()
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.errors) {
          Object.values(e.errors).flat().forEach((m) => toast.error(m))
        } else {
          toast.error(e.message)
        }
      } else {
        toast.error('Something went wrong.')
      }
    }
  }

  const inputCls   = 'w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]'
  const inputStyle = { borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative ml-auto h-full w-full max-w-lg flex flex-col shadow-xl overflow-y-auto"
        style={{ background: 'rgb(var(--surface-bg, 244 246 250))' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ background: 'rgb(var(--surface-card, 255 255 255))', borderColor: 'rgb(var(--border-default, 229 233 240))' }}
        >
          <h2 className="font-semibold">Invite user</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col gap-6 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name</label>
              <input className={inputCls} style={inputStyle} {...register('name')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" className={inputCls} style={inputStyle} {...register('email')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Role</label>
              <div className="flex gap-3">
                {(['admin', 'supervisor', 'teacher'] as const).map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm cursor-pointer capitalize">
                    <input type="radio" value={r} {...register('role')} />
                    {r}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {role === 'supervisor' && (
            <div>
              <p className="text-sm font-semibold mb-3">Permissions</p>
              <PermissionMatrix selected={permissions} onChange={setPermissions} />
            </div>
          )}

          {role === 'admin' && (
            <div className="rounded-xl p-4 bg-blue-50 text-sm text-blue-700">
              Admins automatically have every permission.
            </div>
          )}

          {role === 'teacher' && (
            <div className="rounded-xl p-4 bg-amber-50 text-sm text-amber-700">
              Teacher access is scoped automatically. A detailed teacher profile is set up after the invite.
            </div>
          )}

          <div className="mt-auto flex gap-3 justify-end pt-4 border-t shrink-0" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
              style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: 'rgb(14 124 90)' }}
            >
              {isSubmitting ? 'Sending invite…' : 'Send invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
