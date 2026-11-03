'use client'
import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/system/dashboard/KpiCard'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useSystemUser } from '@/components/system/shell/SystemShell'
import { AccountSheet } from '@/components/system/treasury/AccountSheet'
import { MovementSheet } from '@/components/system/treasury/MovementSheet'
import { MovementsTable } from '@/components/system/treasury/MovementsTable'
import { SelectInput, SimplePager, TextInput } from '@/components/system/treasury/fields'
import { useAccountStatement, useTreasuryAccount, useTreasuryAccounts } from '@/hooks/system/useTreasury'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'
import { can } from '@/lib/system/permissions'
import { monthBounds } from '@/lib/system/treasury'
import type { TreasuryMovement } from '@/types/system/treasury'

export default function TreasuryAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const accountId = Number(id)
  const { t } = useI18n()
  const router = useRouter()
  const user = useSystemUser()
  const canManage = !!user && can(user, 'treasury.manage')
  const canRecord = !!user && can(user, 'treasury.record')

  const { data: account, isLoading, isError } = useTreasuryAccount(accountId)
  const { data: overview } = useTreasuryAccounts()

  const [filters, setFilters] = useState({ from: '', to: '', q: '', direction: '', page: 1 })
  const setFilter = (patch: Partial<typeof filters>) => setFilters(f => ({ ...f, page: 1, ...patch }))

  const { data: statement, isLoading: statementLoading } = useAccountStatement(accountId, filters)

  const [accountSheetOpen, setAccountSheetOpen] = useState(false)
  const [movementSheet, setMovementSheet] = useState<{ open: boolean; editing?: TreasuryMovement | null }>({ open: false })

  if (isError) {
    return (
      <div className="mt-8 text-sm">
        <p className="opacity-60">{t('treasury.statement.notFound')}</p>
        <Link href="/treasury" className="underline">{t('treasury.title')}</Link>
      </div>
    )
  }

  if (isLoading || !account) return <p className="mt-8 opacity-40 text-sm">{t('common.loading')}</p>

  const summary = statement?.summary
  const hasPeriod = !!(filters.from || filters.to)
  const narrowed  = hasPeriod || !!filters.q || !!filters.direction
  const lastPage  = statement?.meta.last_page ?? 1
  const onLastPage = (statement?.meta.current_page ?? 1) >= lastPage

  const money = (minor: number) => formatMoney(minor, account.currency)
  const thisMonth = monthBounds()
  const lastMonth = monthBounds(-1)

  return (
    <>
      <Link href="/treasury" className="inline-flex items-center gap-1 text-sm opacity-60 hover:opacity-100 mb-3">
        <ArrowLeft size={14} /> {t('treasury.title')}
      </Link>

      <PageHeader
        title={account.name}
        description={[
          account.is_active ? t(`treasury.types.${account.type}`) : t('treasury.archived'),
          account.currency,
          account.identifier,
        ].filter(Boolean).join(' · ')}
      >
        {canManage && (
          <Button variant="outline" onClick={() => setAccountSheetOpen(true)}>
            <Pencil size={14} /> {t('common.edit')}
          </Button>
        )}
        {canRecord && account.is_active && (
          <Button onClick={() => setMovementSheet({ open: true })}>
            <Plus size={16} /> {t('treasury.addMovement')}
          </Button>
        )}
      </PageHeader>

      {account.notes && <p className="-mt-3 mb-5 text-sm opacity-60 whitespace-pre-line">{account.notes}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={t('treasury.currentBalance')} value={money(account.balance_minor)} />
        <KpiCard
          label={t(hasPeriod ? 'treasury.statement.periodStart' : 'treasury.account.openingBalance')}
          value={money(summary?.balance_at_start ?? account.opening_balance_minor)}
          sub={hasPeriod ? undefined : account.opening_date}
        />
        <KpiCard label={t('treasury.statement.totalIn')} value={money(summary?.total_in ?? 0)} loading={!summary} />
        <KpiCard
          label={t('treasury.statement.totalOut')}
          value={money(summary?.total_out ?? 0)}
          loading={!summary}
          sub={hasPeriod && summary ? `${t('treasury.statement.periodEnd')}: ${money(summary.balance_at_end)}` : undefined}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 mt-6 mb-3">
        <div className="flex gap-1">
          <PresetButton active={!hasPeriod} onClick={() => setFilter({ from: '', to: '' })}>
            {t('common.all')}
          </PresetButton>
          <PresetButton
            active={filters.from === thisMonth.from && filters.to === thisMonth.to}
            onClick={() => setFilter(thisMonth)}
          >
            {t('treasury.thisMonth')}
          </PresetButton>
          <PresetButton
            active={filters.from === lastMonth.from && filters.to === lastMonth.to}
            onClick={() => setFilter(lastMonth)}
          >
            {t('treasury.lastMonth')}
          </PresetButton>
        </div>
        <TextInput
          className="w-auto"
          type="date"
          aria-label={t('treasury.statement.from')}
          title={t('treasury.statement.from')}
          value={filters.from}
          onChange={e => setFilter({ from: e.target.value })}
        />
        <TextInput
          className="w-auto"
          type="date"
          aria-label={t('treasury.statement.to')}
          title={t('treasury.statement.to')}
          value={filters.to}
          onChange={e => setFilter({ to: e.target.value })}
        />
        <TextInput
          className="w-52"
          type="search"
          value={filters.q}
          placeholder={t('treasury.statement.searchPlaceholder')}
          onChange={e => setFilter({ q: e.target.value })}
        />
        <SelectInput
          className="w-auto"
          aria-label={t('treasury.statement.direction')}
          value={filters.direction}
          onChange={e => setFilter({ direction: e.target.value })}
        >
          <option value="">{t('treasury.statement.allDirections')}</option>
          <option value="in">{t('treasury.statement.in')}</option>
          <option value="out">{t('treasury.statement.out')}</option>
        </SelectInput>
      </div>

      <MovementsTable
        rows={statement?.data ?? []}
        loading={statementLoading}
        showBalance
        canRecord={canRecord && account.is_active}
        onEdit={row => setMovementSheet({ open: true, editing: row })}
        openingRow={!narrowed && onLastPage ? account : null}
      />
      <SimplePager
        page={statement?.meta.current_page ?? 1}
        lastPage={lastPage}
        onPage={page => setFilters(f => ({ ...f, page }))}
      />

      <AccountSheet
        open={accountSheetOpen}
        account={account}
        onClose={() => setAccountSheetOpen(false)}
        onDeleted={() => router.push('/treasury')}
      />
      <MovementSheet
        open={movementSheet.open}
        editing={movementSheet.editing}
        accounts={overview?.data ?? [account]}
        defaultAccountId={account.id}
        onClose={() => setMovementSheet({ open: false })}
      />
    </>
  )
}

function PresetButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-2 rounded-xl text-sm border transition-colors ${active ? 'bg-secondary border-secondary text-white' : 'border-black/10 opacity-70 hover:opacity-100'}`}
    >
      {children}
    </button>
  )
}
