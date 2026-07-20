'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'
import { useUsers } from '@/hooks/system/useUsers'
import { useTeachers } from '@/hooks/system/useTeachers'
import {
  useQcAssignments,
  useCreateQcAssignment,
  useDeleteQcAssignment,
} from '@/hooks/system/useQualityControl'
import type { QcAssignment } from '@/types/system/qualityControl'
import { ApiError } from '@/lib/system/api'
import { SearchSelect } from '../SearchSelect'
import { Avatar } from '../RangeToggle'

const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'
const MUTED  = 'rgb(90 100 112)'
const TEAL   = '#0d9488'

const STAFF_ROLES = ['admin', 'supervisor', 'quality', 'accountant']

export function AssignmentsTab() {
  const { t } = useI18n()
  const { data: assignments = [], isLoading } = useQcAssignments()
  const create = useCreateQcAssignment()
  const del    = useDeleteQcAssignment()
  const usersQ    = useUsers()
  const teachersQ = useTeachers({ is_active: '1' })

  const managerOptions = (usersQ.data?.data ?? [])
    .filter(u => STAFF_ROLES.includes(u.role as string))
    .map(u => ({ value: String(u.id), label: u.name }))
  const teacherOptions = (teachersQ.data?.data ?? []).map(x => ({ value: String(x.id), label: x.name ?? `#${x.id}` }))

  const [mgr, setMgr]         = useState('')
  const [teacher, setTeacher] = useState('')

  async function add() {
    if (!mgr || !teacher) return
    try {
      await create.mutateAsync({ quality_manager_id: Number(mgr), teacher_id: Number(teacher) })
      toast.success(t('qualityControl.settingsModal.assignmentAdded'))
      setMgr(''); setTeacher('')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('qualityControl.settingsModal.saveError'))
    }
  }
  async function remove(a: QcAssignment) {
    if (!window.confirm(t('qualityControl.settingsModal.deleteAssignmentConfirm'))) return
    await del.mutateAsync(a.id)
    toast.success(t('qualityControl.settingsModal.assignmentDeleted'))
  }

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: MUTED }}>{t('qualityControl.settingsModal.assignmentsHint')}</p>

      {/* Add assignment */}
      <div className="rounded-xl border p-3" style={{ borderColor: BORDER, background: 'rgba(13,148,136,0.03)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <label className="text-[11px] font-medium" style={{ color: MUTED }}>
            {t('qualityControl.settingsModal.assignmentManager')}
            <div className="mt-1"><SearchSelect value={mgr} onChange={setMgr} options={managerOptions} placeholder={t('qualityControl.settingsModal.assignmentManager')} /></div>
          </label>
          <label className="text-[11px] font-medium" style={{ color: MUTED }}>
            {t('qualityControl.settingsModal.assignmentTeacher')}
            <div className="mt-1"><SearchSelect value={teacher} onChange={setTeacher} options={teacherOptions} placeholder={t('qualityControl.settingsModal.assignmentTeacher')} /></div>
          </label>
          <button onClick={add} disabled={create.isPending || !mgr || !teacher} className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-white text-sm disabled:opacity-40" style={{ background: '#0B1F3A' }}>
            <Plus size={14} /> {t('qualityControl.settingsModal.addAssignment')}
          </button>
        </div>
      </div>

      {/* Assignments list */}
      {isLoading ? (
        <p className="py-8 text-center text-sm" style={{ color: MUTED }}>…</p>
      ) : assignments.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: MUTED }}>{t('qualityControl.settingsModal.emptyAssignments')}</p>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ borderColor: BORDER }}>
              <Avatar name={a.quality_manager_name} size={28} />
              <span className="text-sm font-medium truncate" style={{ color: NAVY }}>{a.quality_manager_name ?? t('qualityControl.table.unknown')}</span>
              <ArrowRight size={14} style={{ color: TEAL }} className="shrink-0" />
              <span className="text-sm truncate flex-1" style={{ color: NAVY }}>{a.teacher_name ?? t('qualityControl.table.unknown')}</span>
              <button onClick={() => remove(a)} className="shrink-0 p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors" aria-label={t('qualityControl.table.delete')}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
