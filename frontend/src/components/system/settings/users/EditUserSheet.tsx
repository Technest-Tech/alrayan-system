'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { useUpdateUser } from '@/hooks/system/useUsers'
import { PermissionMatrix } from './PermissionMatrix'
import { ApiError } from '@/lib/system/api'
import { useI18n } from '@/lib/system/i18n'
import type { SystemUserRecord } from '@/hooks/system/useUsers'

const schema = z.object({
  name: z.string().min(1, 'name-required'),
  role: z.enum(['admin', 'supervisor', 'teacher']),
})
type FormValues = z.infer<typeof schema>

const ROLES = ['admin', 'supervisor', 'teacher'] as const

interface Props {
  user:    SystemUserRecord
  onClose: () => void
}

export function EditUserSheet({ user, onClose }: Props) {
  const { t } = useI18n()
  const [permissions, setPermissions] = useState<string[]>(user.permissions ?? [])
  const update = useUpdateUser()

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, role: user.role },
  })

  const role = watch('role')

  async function onSubmit(values: FormValues) {
    try {
      await update.mutateAsync({
        id:   user.id,
        data: { ...values, permissions: role === 'supervisor' ? permissions : [] },
      })
      toast.success(t('users.toastUpdated'))
      onClose()
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.errors) {
          Object.values(e.errors).flat().forEach((m) => toast.error(m))
        } else {
          toast.error(e.message)
        }
      } else {
        toast.error(t('users.toastError'))
      }
    }
  }

  const errName = errors.name ? t('users.errorNameRequired') : undefined

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
          <h2 className="font-semibold">{t('users.editUserTitle')}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col gap-6 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('common.name')}</label>
              <input className={inputCls} style={inputStyle} {...register('name')} />
              {errName && <p className="text-red-500 text-xs mt-1">{errName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('common.email')}</label>
              <input value={user.email} disabled className={inputCls + ' opacity-50'} style={inputStyle} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('common.role')}</label>
              <div className="flex gap-3">
                {ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" value={r} {...register('role')} />
                    {t(`users.role.${r}`)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {role === 'supervisor' && (
            <div>
              <p className="text-sm font-semibold mb-3">{t('users.columnPermissions')}</p>
              <p className="text-xs opacity-50 mb-3">{t('users.permissionsNote')}</p>
              <PermissionMatrix selected={permissions} onChange={setPermissions} />
            </div>
          )}

          {role === 'admin' && (
            <div className="rounded-xl p-4 bg-blue-50 text-sm text-blue-700">
              {t('users.adminPermissionsNote')}
            </div>
          )}

          <div className="mt-auto flex gap-3 justify-end pt-4 border-t shrink-0" style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
              style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: 'rgb(14 124 90)' }}
            >
              {isSubmitting ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
