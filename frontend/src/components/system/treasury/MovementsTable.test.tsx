import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nProvider } from '@/lib/system/i18n'
import { ConfirmProvider } from '@/components/system/primitives/ConfirmDialog'
import type { TreasuryAccount, TreasuryMovement } from '@/types/system/treasury'
import { MovementsTable } from './MovementsTable'

function movement(overrides: Partial<TreasuryMovement>): TreasuryMovement {
  return {
    id: 1,
    account: { id: 7, name: 'PayPal', currency: 'USD' },
    direction: 'in',
    kind: 'income',
    amount_minor: 2500,
    occurred_on: '2026-11-01',
    description: 'Student payment',
    counterparty: null,
    reference: null,
    expense_id: null,
    category: null,
    transfer_group: null,
    source_type: null,
    source_id: null,
    created_by: null,
    created_at: '2026-11-01T10:00:00Z',
    ...overrides,
  }
}

function show(props: Partial<React.ComponentProps<typeof MovementsTable>>) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nProvider>
        <ConfirmProvider>
          <MovementsTable rows={[]} canRecord onEdit={vi.fn()} {...props} />
        </ConfirmProvider>
      </I18nProvider>
    </QueryClientProvider>,
  )
}

const rowOf = (text: string) => screen.getByText(text).closest('tr') as HTMLElement

describe('MovementsTable', () => {
  it('shows a hand-entered movement with edit and delete', () => {
    show({ rows: [movement({})] })

    const row = within(rowOf('Student payment'))
    expect(row.getByText('$25.00')).toBeTruthy()
    expect(row.getByRole('button', { name: 'Edit' })).toBeTruthy()
    expect(row.getByRole('button', { name: 'Delete' })).toBeTruthy()
  })

  it('sends an expense movement to its expense instead of editing it here', () => {
    show({ rows: [movement({ direction: 'out', kind: 'expense', expense_id: 42, description: 'Rent', category: 'Office' })] })

    const row = within(rowOf('Rent'))
    expect(row.getByRole('link', { name: 'Open expense' }).getAttribute('href')).toBe('/accounting/expenses/42')
    expect(row.queryByRole('button')).toBeNull()
  })

  it('sends automatic movements to the page that owns them', () => {
    show({
      rows: [
        movement({ id: 1, kind: 'student_payment', description: 'Package #1', source_type: 'package', source_id: 9 }),
        movement({ id: 2, direction: 'out', kind: 'teacher_salary', description: 'Salary', source_type: 'payroll', source_id: 3 }),
      ],
    })

    const payment = within(rowOf('Package #1'))
    expect(payment.getByRole('link', { name: 'Open payments' }).getAttribute('href')).toBe('/payments')
    expect(payment.queryByRole('button')).toBeNull()

    const salary = within(rowOf('Salary'))
    expect(salary.getByRole('link', { name: 'Open payroll' }).getAttribute('href')).toBe('/payroll')
    expect(salary.queryByRole('button')).toBeNull()
  })

  it('lets a transfer be deleted but not edited', () => {
    show({ rows: [movement({ direction: 'out', kind: 'transfer', description: 'To bank' })] })

    const row = within(rowOf('To bank'))
    expect(row.queryByRole('button', { name: 'Edit' })).toBeNull()
    expect(row.getByRole('button', { name: 'Delete' })).toBeTruthy()
  })

  it('offers no actions without the right to record', () => {
    show({ rows: [movement({})], canRecord: false })

    expect(within(rowOf('Student payment')).queryByRole('button')).toBeNull()
  })

  it('flags a negative running balance and closes the statement with the opening balance', () => {
    const account = { opening_date: '2026-10-01', opening_balance_minor: 5000, currency: 'USD' } as TreasuryAccount

    show({
      rows: [movement({ direction: 'out', kind: 'withdrawal', description: 'Draw', balance_after_minor: -1000 })],
      showBalance: true,
      openingRow: account,
    })

    expect(within(rowOf('Draw')).getByText('-$10.00').className).toContain('text-red-600')
    expect(within(rowOf('Opening balance')).getByText('$50.00')).toBeTruthy()
  })
})
