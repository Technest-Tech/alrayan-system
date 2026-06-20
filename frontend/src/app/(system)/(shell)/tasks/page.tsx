'use client'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, ListChecks } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useTasks } from '@/hooks/system/useTasks'
import { useUser } from '@/lib/system/auth'
import { TaskKanban } from '@/components/system/tasks/TaskKanban'
import { TaskList } from '@/components/system/tasks/TaskList'
import { TaskCardsGrid } from '@/components/system/tasks/TaskCardsGrid'
import { TaskDetailPanel } from '@/components/system/tasks/TaskDetailPanel'
import { CreateTaskModal } from '@/components/system/tasks/CreateTaskModal'
import { TaskFiltersBar, type TaskFilterState } from '@/components/system/tasks/TaskFiltersBar'
import { useI18n } from '@/lib/system/i18n'

const STAR_PATH = 'M50,5 L57.65,31.52 L81.82,18.18 L68.48,42.35 L95,50 L68.48,57.65 L81.82,81.82 L57.65,68.48 L50,95 L42.35,68.48 L18.18,81.82 L31.52,57.65 L5,50 L31.52,42.35 L18.18,18.18 L42.35,31.52 Z'

export default function TasksPage() {
  const qc = useQueryClient()
  const { t } = useI18n()
  const { data: user } = useUser()
  const [filters, setFilters] = useState<TaskFilterState>({})
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const canDecide = !!user && (user.role === 'admin' || user.permissions.includes('tasks.approve'))

  const { mine, ...rest } = filters
  const { data, isLoading, isFetching } = useTasks({ ...rest, mine: mine === '1', per_page: 500 })
  const tasks = data?.data ?? []

  return (
    <div className="min-w-0">
      {/* Header */}
      <div className="rounded-2xl mb-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d2548 0%, #0B1F3A 60%, #071528 100%)', boxShadow: '0 4px 24px rgb(11 31 58 / 0.18)' }}>
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent 0%, #C9A24B 30%, #C9A24B 70%, transparent 100%)' }} />
        <div className="relative px-5 py-4" style={{ overflow: 'hidden' }}>
          <svg className="absolute right-0 top-0 pointer-events-none select-none" width="220" height="90" aria-hidden>
            <g transform="translate(140, -20) scale(1.8)" opacity="0.04"><path d={STAR_PATH} fill="#C9A24B" /></g>
          </svg>
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <ListChecks size={22} color="#C9A24B" />
              <div>
                <h1 className="text-2xl font-bold text-white leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '-0.01em' }}>{t('tasks.title')}</h1>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(201,162,75,0.7)' }}>{t('tasks.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => qc.invalidateQueries({ queryKey: ['system', 'tasks'] })}
                disabled={isFetching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} /> {t('tasks.refresh')}
              </button>
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm"
                style={{ background: 'rgb(14 124 90)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <Plus size={13} /> {t('tasks.createTask')}
              </button>
            </div>
          </div>
        </div>
        <div style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, #C9A24B88, transparent)' }} />
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">{t('tasks.viewKanban')}</TabsTrigger>
          <TabsTrigger value="list">{t('tasks.viewList')}</TabsTrigger>
          <TabsTrigger value="cards">{t('tasks.viewCards')}</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TaskFiltersBar filters={filters} onChange={setFilters} />
        </div>

        <TabsContent value="kanban">
          <TaskKanban tasks={tasks} isLoading={isLoading} canDecide={canDecide} onSelect={setSelectedId} />
        </TabsContent>
        <TabsContent value="list">
          <TaskList tasks={tasks} isLoading={isLoading} onSelect={setSelectedId} />
        </TabsContent>
        <TabsContent value="cards">
          <TaskCardsGrid tasks={tasks} isLoading={isLoading} canDecide={canDecide} onSelect={setSelectedId} />
        </TabsContent>
      </Tabs>

      <TaskDetailPanel taskId={selectedId} canDecide={canDecide} onClose={() => setSelectedId(null)} />
      <CreateTaskModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
