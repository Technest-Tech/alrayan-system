'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRequestLeave } from '@/hooks/system/useTeacherLeaves'
import { ApiError } from '@/lib/system/api'

const schema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date:   z.string().min(1, 'End date is required'),
  reason:     z.string().min(3, 'Reason is required'),
}).refine((d) => d.start_date <= d.end_date, { message: 'End date must be on or after start date', path: ['end_date'] })

type FormValues = z.infer<typeof schema>

interface LeaveRequestFormProps {
  teacherId?: number
  onSuccess: () => void
}

const inputCls   = 'w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[rgb(14,124,90)]'
const inputStyle = { borderColor: 'rgb(var(--border-default, 229 233 240))', background: 'rgb(var(--surface-card, 255 255 255))' }

export function LeaveRequestForm({ teacherId, onSuccess }: LeaveRequestFormProps) {
  const requestLeave = useRequestLeave()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    try {
      await requestLeave.mutateAsync({ ...values, teacher_id: teacherId })
      toast.success('Leave request submitted.')
      reset()
      onSuccess()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to submit leave request.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Start date</label>
          <input type="date" className={inputCls} style={inputStyle} {...register('start_date')} />
          {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">End date</label>
          <input type="date" className={inputCls} style={inputStyle} {...register('end_date')} />
          {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Reason</label>
        <textarea rows={3} className={inputCls} style={inputStyle} placeholder="Explain the reason for leave…" {...register('reason')} />
        {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: 'rgb(14 124 90)' }}
        >
          {isSubmitting ? 'Submitting…' : 'Submit leave request'}
        </button>
      </div>
    </form>
  )
}
