import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { I18nProvider } from '@/lib/system/i18n'
import { ProfitabilityTable } from './ProfitabilityTable'
import type { ProfitabilityReport } from '@/types/system/profitability'

/** One teacher: $20.00 billed, $5.00 salary cost, $15.00 margin, 33% + 6.7% off → $9.04 net. */
const report: ProfitabilityReport = {
  month: '2026-05',
  currency: 'USD',
  cost_currency: 'USD',
  rows: [
    {
      teacher_id: 1,
      name: 'Fayyad',
      photo_url: null,
      hours: 2,
      lessons: 2,
      income_minor: 2000,
      income_by_currency: [{ currency: 'EUR', amount_minor: 1800 }],
      rate_minor: 250,
      rate_currency: 'USD',
      tier_index: 0,
      cost_minor: 500,
      cost_report_minor: 500,
      gross_margin_minor: 1500,
      deductions: [
        { key: 'ads', label: 'Ads', percent: 33, amount_minor: 495 },
        { key: 'charity', label: 'Charity', percent: 6.7, amount_minor: 101 },
      ],
      net_profit_minor: 904,
      margin_pct: 75,
      excluded: false,
      partial: false,
    },
  ],
  totals: {
    hours: 2,
    lessons: 2,
    income_minor: 2000,
    cost_minor: 500,
    gross_margin_minor: 1500,
    net_profit_minor: 904,
    teacher_count: 1,
    deductions: [
      { key: 'ads', label: 'Ads', percent: 33, amount_minor: 495 },
      { key: 'charity', label: 'Charity', percent: 6.7, amount_minor: 101 },
    ],
    avg_rate_minor: 250,
    partner_count: 3,
    partner_share_minor: 301,
  },
  deductions: [
    { key: 'ads', label: 'Ads', percent: 33 },
    { key: 'charity', label: 'Charity', percent: 6.7 },
  ],
  partner_count: 3,
  currencies: ['USD', 'EUR', 'EGP'],
  fx: { source: 'live', fetched_at: null, unconvertible: [] },
  generated_at: '2026-05-31T00:00:00Z',
}

function renderTable(props: Partial<Parameters<typeof ProfitabilityTable>[0]> = {}) {
  return render(
    <I18nProvider>
      <ProfitabilityTable
        report={report}
        canEditSettings={false}
        onPercentChange={vi.fn()}
        {...props}
      />
    </I18nProvider>,
  )
}

describe('ProfitabilityTable', () => {
  it('renders the income → cost → margin → net chain for a teacher', () => {
    renderTable()
    expect(screen.getByText('Fayyad')).toBeInTheDocument()
    expect(screen.getByText('€18.00')).toBeInTheDocument()   // billed currency, under income
    expect(screen.getAllByText('2.0').length).toBeGreaterThan(0) // hours (row + totals)
    expect(screen.getAllByText('$20.00').length).toBeGreaterThan(0)  // income (row + totals)
    expect(screen.getAllByText('$15.00').length).toBeGreaterThan(0)  // gross margin
    expect(screen.getAllByText('$9.04').length).toBeGreaterThan(0)   // net profit
    expect(screen.getAllByText('$4.95').length).toBeGreaterThan(0)   // 33% ads
  })

  it('shows the totals row with the per-partner split', () => {
    renderTable()
    const totals = screen.getByText('TOTALS').closest('tr')!
    expect(within(totals).getByText('$20.00')).toBeInTheDocument()
    expect(within(totals).getByText(/\$3\.01/)).toBeInTheDocument()
    expect(within(totals).getByText(/\/ partner \(3\)/)).toBeInTheDocument()
  })

  it('renders percentages read-only without the settings permission', () => {
    renderTable()
    expect(screen.getByText('(33%)')).toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  it('commits an edited percentage on blur, once', () => {
    const onPercentChange = vi.fn()
    renderTable({ canEditSettings: true, onPercentChange })

    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs).toHaveLength(2)

    fireEvent.change(inputs[0], { target: { value: '40' } })
    expect(onPercentChange).not.toHaveBeenCalled()   // not on every keystroke

    fireEvent.blur(inputs[0])
    expect(onPercentChange).toHaveBeenCalledExactlyOnceWith('ads', 40)
  })

  it('does not fire a save when the percentage is unchanged', () => {
    const onPercentChange = vi.fn()
    renderTable({ canEditSettings: true, onPercentChange })

    const input = screen.getAllByRole('spinbutton')[0]
    fireEvent.change(input, { target: { value: '33' } })
    fireEvent.blur(input)
    expect(onPercentChange).not.toHaveBeenCalled()
  })
})
