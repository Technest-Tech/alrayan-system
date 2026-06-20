'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Layers, Key } from 'lucide-react'
import { toast } from 'sonner'
import { UsersStatCards } from '@/components/system/users/UsersStatCards'
import { UsersFilterBar } from '@/components/system/users/UsersFilterBar'
import { UsersDirectoryTable } from '@/components/system/users/UsersDirectoryTable'
import { UserFormDialog } from '@/components/system/users/UserFormDialog'
import { UserRolesTab } from '@/components/system/users/UserRolesTab'
import { useUserDirectory, useUserStats, useUserStatusTransition, useDeleteUser } from '@/hooks/system/useUserDirectory'
import { useUrlFilters } from '@/lib/system/filters'
import { useConfirm } from '@/components/system/primitives/ConfirmDialog'
import { useI18n } from '@/lib/system/i18n'
import type { DirectoryUser } from '@/types/system/user-directory'

type Tab = 'directory' | 'roles'

export default function UsersPage() {
  const router  = useRouter()
  const { t }   = useI18n()
  const confirm = useConfirm()
  const [tab, setTab] = useState<Tab>('directory')

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'directory', label: t('users.tabDirectory'),           icon: <Layers size={14} /> },
    { id: 'roles',     label: t('users.tabRolesAndPermissions'), icon: <Key size={14} /> },
  ]
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const { filters, setFilter, resetFilters } = useUrlFilters(['q', 'role', 'status', 'language', 'activity', 'assigned_teacher', 'course'])

  // Reset to page 1 whenever a filter changes.
  const filterKey = JSON.stringify(filters)
  useEffect(() => { setPage(1) }, [filterKey, perPage])

  const { data, isLoading } = useUserDirectory({
    q:                filters.q || undefined,
    role:             filters.role || undefined,
    status:           filters.status || undefined,
    language:         filters.language || undefined,
    activity:         filters.activity || undefined,
    assigned_teacher: filters.assigned_teacher || undefined,
    course:           filters.course || undefined,
    page,
    per_page: perPage,
  })
  const { data: stats, isLoading: statsLoading } = useUserStats()
  const transition = useUserStatusTransition()
  const remove = useDeleteUser()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DirectoryUser | null>(null)

  const users = data?.data ?? []

  function openCreate() { setEditing(null); setDialogOpen(true) }
  function openEdit(user: DirectoryUser) { setEditing(user); setDialogOpen(true) }

  async function onDelete(user: DirectoryUser) {
    const ok = await confirm({
      title: `Delete ${user.name}?`,
      description: 'This removes the user account. Student history is archived, not erased. This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await remove.mutateAsync(user.id)
      toast.success('User deleted')
    } catch {
      toast.error('Could not delete user')
    }
  }

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'rgb(11 31 58)' }}>{t('users.title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgb(90 100 112)' }}>{t('users.subtitle')}</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: 'rgb(14 124 90)' }}
        >
          <Plus size={15} />
          {t('users.addUser')}
        </button>
      </div>

      <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'rgb(var(--border-default,229 233 240))' }}>
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
              style={active ? { borderColor: 'rgb(14 124 90)', color: 'rgb(14 124 90)' } : { borderColor: 'transparent', color: 'rgb(90 100 112)' }}
            >
              {t.icon}
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'directory' ? (
        <>
          <UsersStatCards stats={stats} loading={statsLoading} />
          <UsersFilterBar filters={filters} setFilter={setFilter} resetFilters={resetFilters} />

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold inline-flex items-center gap-2" style={{ color: 'rgb(11 31 58)' }}>
              <Layers size={15} /> {t('users.title')}
            </h2>
            <span className="text-xs" style={{ color: 'rgb(90 100 112)' }}>{data?.meta?.total ?? 0} {t('common.total').toLowerCase()}</span>
          </div>

          <UsersDirectoryTable
            data={users}
            meta={data?.meta}
            isLoading={isLoading}
            perPage={perPage}
            onView={(u) => router.push(`/users/${u.id}`)}
            onEdit={openEdit}
            onDelete={onDelete}
            onPage={setPage}
            onPerPage={setPerPage}
          />
        </>
      ) : (
        <UserRolesTab />
      )}

      <UserFormDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editing} />
    </>
  )
}
