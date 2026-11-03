'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Banknote, Coins, CreditCard, Landmark, Plus, Repeat, Smartphone, Wallet, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/system/dashboard/KpiCard'
import { EmptyState } from '@/components/system/primitives/EmptyState'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useSystemUser } from '@/components/system/shell/SystemShell'
import { AccountSheet } from '@/components/system/treasury/AccountSheet'
import { AutoPostingSheet } from '@/components/system/treasury/AutoPostingSheet'
import { MovementSheet } from '@/components/system/treasury/MovementSheet'
import { MovementsTable } from '@/components/system/treasury/MovementsTable'
import { SelectInput, SimplePager, TextInput } from '@/components/system/treasury/fields'
import { useTreasuryAccounts, useTreasuryMovements } from '@/hooks/system/useTreasury'
import { formatMoney } from '@/lib/money'
import { useI18n } from '@/lib/system/i18n'
import { can } from '@/lib/system/permissions'
import type { AccountType, TreasuryAccount, TreasuryMovement } from '@/types/system/treasury'

const TYPE_ICONS: Record<AccountType, LucideIcon> = {
  bank:          Landmark,
  paypal:        CreditCard,
  cash:          Coins,
  mobile_wallet: Smartphone,
  other:         Wallet,
}

export default function TreasuryPage() {
  const { t } = useI18n()
  const user = useSystemUser()
  const canManage = !!user && can(user, 'treasury.manage')
  const canRecord = !!user && can(user, 'treasury.record')

  const { data: overview, isLoading } = useTreasuryAccounts()
  const accounts = overview?.data ?? []
  const activeAccounts = accounts.filter(a => a.is_active)
  const archivedAccounts = accounts.filter(a => !a.is_active)

  const [showArchived, setShowArchived] = useState(false)
  const [accountSheetOpen, setAccountSheetOpen] = useState(false)
  const [autoPostingOpen, setAutoPostingOpen] = useState(false)
  const [movementSheet, setMovementSheet] = useState<{ open: boolean; editing?: TreasuryMovement | null }>({ open: false })
  const [filters, setFilters] = useState({ q: '', account_id: '', direction: '', page: 1 })
  const setFilter = (patch: Partial<typeof filters>) => setFilters(f => ({ ...f, page: 1, ...patch }))

  const { data: movements, isLoading: movementsLoading } = useTreasuryMovements({ ...filters, per_page: 25 })

  return (
    <>
      <PageHeader title={t('treasury.title')} description={t('treasury.subtitle')}>
        {canRecord && activeAccounts.length > 0 && (
          <Button variant="outline" onClick={() => setMovementSheet({ open: true })}>
            <Plus size={16} /> {t('treasury.addMovement')}
          </Button>
        )}
        {canManage && activeAccounts.length > 0 && (
          <Button variant="outline" onClick={() => setAutoPostingOpen(true)}>
            <Repeat size={16} /> {t('treasury.autoPosting.title')}
          </Button>
        )}
        {canManage && (
          <Button onClick={() => setAccountSheetOpen(true)}>
            <Plus size={16} /> {t('treasury.newAccount')}
          </Button>
        )}
      </PageHeader>

      {!isLoading && accounts.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title={t('treasury.noAccounts')}
          description={t('treasury.noAccountsHint')}
        />
      ) : (
        <>
          {/* Totals: one card per currency — balances in different currencies don't add up. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading && <KpiCard label={t('treasury.balance')} value="" loading />}
            {overview?.totals.map(total => (
              <KpiCard
                key={total.currency}
                label={t('treasury.totalIn', { currency: total.currency })}
                value={formatMoney(total.balance_minor, total.currency)}
                delta={t('treasury.monthMovement', {
                  in:  formatMoney(total.month_in_minor, total.currency),
                  out: formatMoney(total.month_out_minor, total.currency),
                })}
                sub={t('treasury.excludingTransfers')}
              />
            ))}
            {overview?.grand_total && (
              <KpiCard
                label={t('treasury.approxTotal')}
                value={`≈ ${formatMoney(overview.grand_total.balance_minor, overview.grand_total.currency)}`}
                delta={t('treasury.approxHint')}
                sub={overview.grand_total.partial ? t('treasury.partialHint') : undefined}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {activeAccounts.map(account => <AccountCard key={account.id} account={account} />)}
            {showArchived && archivedAccounts.map(account => <AccountCard key={account.id} account={account} />)}
          </div>

          {archivedAccounts.length > 0 && (
            <button type="button" onClick={() => setShowArchived(v => !v)} className="mt-3 text-xs opacity-60 hover:opacity-100 underline">
              {showArchived
                ? t('treasury.hideArchived')
                : t('treasury.showArchived', { count: String(archivedAccounts.length) })}
            </button>
          )}

          <h2 className="mt-8 mb-3 text-base font-semibold">{t('treasury.statement.recent')}</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            <TextInput
              className="w-60"
              type="search"
              value={filters.q}
              placeholder={t('treasury.statement.searchPlaceholder')}
              onChange={e => setFilter({ q: e.target.value })}
            />
            <SelectInput
              className="w-auto"
              aria-label={t('treasury.movement.account')}
              value={filters.account_id}
              onChange={e => setFilter({ account_id: e.target.value })}
            >
              <option value="">{t('treasury.statement.allAccounts')}</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </SelectInput>
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
            rows={movements?.data ?? []}
            loading={movementsLoading}
            showAccount
            canRecord={canRecord}
            onEdit={row => setMovementSheet({ open: true, editing: row })}
          />
          <SimplePager
            page={movements?.meta.current_page ?? 1}
            lastPage={movements?.meta.last_page ?? 1}
            onPage={page => setFilters(f => ({ ...f, page }))}
          />
        </>
      )}

      <AccountSheet open={accountSheetOpen} onClose={() => setAccountSheetOpen(false)} />
      <AutoPostingSheet open={autoPostingOpen} accounts={accounts} onClose={() => setAutoPostingOpen(false)} />
      <MovementSheet
        open={movementSheet.open}
        editing={movementSheet.editing}
        accounts={accounts}
        onClose={() => setMovementSheet({ open: false })}
      />
    </>
  )
}

function AccountCard({ account }: { account: TreasuryAccount }) {
  const { t } = useI18n()
  const Icon = TYPE_ICONS[account.type] ?? Wallet

  return (
    <Link
      href={`/treasury/${account.id}`}
      className={`block rounded-2xl p-5 transition-shadow hover:shadow-md ${account.is_active ? '' : 'opacity-60'}`}
      style={{ background: 'rgb(var(--surface-card, 255 255 255))', border: '1px solid rgb(var(--border-default))' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgb(var(--surface-card-2))' }}>
          <Icon size={18} className="opacity-60" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{account.name}</p>
          <p className="text-xs opacity-50 truncate">
            {account.is_active ? t(`treasury.types.${account.type}`) : t('treasury.archived')}
            {account.identifier ? ` · ${account.identifier}` : ''}
          </p>
        </div>
      </div>

      <p className={`mt-4 text-2xl font-bold tabular-nums ${account.balance_minor < 0 ? 'text-red-600' : ''}`}>
        {formatMoney(account.balance_minor, account.currency)}
      </p>

      <div className="mt-2 flex flex-wrap gap-x-4 text-xs tabular-nums">
        <span className="text-emerald-600">+{formatMoney(account.month_in_minor, account.currency)}</span>
        <span className="text-red-600">−{formatMoney(account.month_out_minor, account.currency)}</span>
        <span className="opacity-50">{t('treasury.thisMonth')}</span>
      </div>
    </Link>
  )
}
