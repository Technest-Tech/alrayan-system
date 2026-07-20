'use client'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, RefreshCw, Settings, ClipboardCheck } from 'lucide-react'
import { useI18n } from '@/lib/system/i18n'
import { useUser } from '@/lib/system/auth'
import { KpiCard } from '@/components/system/dashboard/KpiCard'
import {
  useQcDashboard,
  useQcEvaluations,
  useDeleteQcEvaluation,
  type QcEvaluationFilters,
} from '@/hooks/system/useQualityControl'
import type { QcEvaluation } from '@/types/system/qualityControl'
import { EvaluationsFilters } from '@/components/system/quality-control/EvaluationsFilters'
import { EvaluationsTable } from '@/components/system/quality-control/EvaluationsTable'
import { TopPerformersPanel } from '@/components/system/quality-control/TopPerformersPanel'
import { TopTeachersPanel } from '@/components/system/quality-control/TopTeachersPanel'
import { SupervisorActivityPanel } from '@/components/system/quality-control/SupervisorActivityPanel'
import { EvaluationModal, type EvaluationModalMode } from '@/components/system/quality-control/EvaluationModal'
import { QcSettingsModal } from '@/components/system/quality-control/QcSettingsModal'

interface ModalState { open: boolean; mode: EvaluationModalMode; id: number | null }

export default function QualityControlPage() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const { data: user } = useUser()

  const [filters, setFilters]         = useState<QcEvaluationFilters>({})
  const [modal, setModal]             = useState<ModalState>({ open: false, mode: 'create', id: null })
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { data: dashboard, isLoading: dashLoading, isFetching } = useQcDashboard()
  const { data: evaluations, isLoading: evalLoading } = useQcEvaluations({ ...filters, per_page: 100 })
  const deleteEval = useDeleteQcEvaluation()

  const can = (perm: string) => !!user && (user.role === 'admin' || user.permissions.includes(perm))
  const canCreate = can('qc.create')
  const canEdit   = can('qc.edit')
  const canDelete = can('qc.delete')
  const canManage = can('qc.manage_settings')

  const kpis = dashboard?.kpis
  const managerOptions = (dashboard?.supervisor_activity ?? []).map(s => ({
    value: String(s.quality_manager_id),
    label: s.name ?? t('qualityControl.table.unknown'),
  }))

  async function handleDelete(ev: QcEvaluation) {
    if (!window.confirm(t('qualityControl.modal.deleteConfirm'))) return
    await deleteEval.mutateAsync(ev.id)
    toast.success(t('qualityControl.modal.deleted'))
  }

  return (
    <div className="min-w-0 space-y-5">
      {/* Hero header */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d2548 0%, #0B1F3A 60%, #071528 100%)', boxShadow: '0 4px 24px rgb(11 31 58 / 0.18)' }}>
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent 0%, #C9A24B 30%, #C9A24B 70%, transparent 100%)' }} />
        <div className="relative px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <ClipboardCheck size={22} color="#C9A24B" />
            <div>
              <h1 className="text-2xl font-bold text-white leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '-0.01em' }}>{t('qualityControl.title')}</h1>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(201,162,75,0.7)' }}>{t('qualityControl.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ['system', 'qc'] })}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} /> {t('qualityControl.refresh')}
            </button>
            {canManage && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <Settings size={12} /> {t('qualityControl.settings')}
              </button>
            )}
            {canCreate && (
              <button
                onClick={() => setModal({ open: true, mode: 'create', id: null })}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm"
                style={{ background: 'rgb(14 124 90)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <Plus size={13} /> {t('qualityControl.newEvaluation')}
              </button>
            )}
          </div>
        </div>
        <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, #C9A24B88, transparent)' }} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label={t('qualityControl.kpi.total')} value={kpis?.total ?? 0} sub={t('qualityControl.kpi.totalSub')} loading={dashLoading} />
        <KpiCard label={t('qualityControl.kpi.thisMonth')} value={kpis?.this_month ?? 0} delta={t('qualityControl.kpi.thisWeekSub', { count: String(kpis?.this_week ?? 0) })} loading={dashLoading} />
        <KpiCard label={t('qualityControl.kpi.averageScore')} value={`${kpis?.average_score ?? 0}%`} sub={t('qualityControl.kpi.averageSub')} loading={dashLoading} />
        <KpiCard label={t('qualityControl.kpi.teachersEvaluated')} value={kpis?.teachers_evaluated ?? 0} sub={t('qualityControl.kpi.teachersSub')} loading={dashLoading} />
      </div>

      {/* Performers + leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopPerformersPanel thisMonth={dashboard?.top_teachers.this_month ?? []} allTime={dashboard?.top_teachers.all_time ?? []} />
        <TopTeachersPanel thisMonth={dashboard?.top_teachers.this_month ?? []} allTime={dashboard?.top_teachers.all_time ?? []} />
      </div>

      {/* Supervisor activity */}
      <SupervisorActivityPanel activity={dashboard?.supervisor_activity ?? []} />

      {/* Filters + evaluations */}
      <EvaluationsFilters filters={filters} onChange={setFilters} managerOptions={managerOptions} />
      <EvaluationsTable
        evaluations={evaluations?.data ?? []}
        summary={evaluations?.summary}
        isLoading={evalLoading}
        onView={id => setModal({ open: true, mode: 'view', id })}
        onEdit={id => setModal({ open: true, mode: 'edit', id })}
        onDelete={handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      {/* Modals */}
      <EvaluationModal
        open={modal.open}
        onOpenChange={open => setModal(m => ({ ...m, open }))}
        evaluationId={modal.id}
        mode={modal.mode}
      />
      <QcSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
