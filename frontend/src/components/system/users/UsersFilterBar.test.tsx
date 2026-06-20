import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/hooks/system/useCourses', () => ({ useCourses: () => ({ data: [] }) }))
vi.mock('@/hooks/system/useTeachers', () => ({ useTeachers: () => ({ data: { data: [] } }) }))

import { UsersFilterBar } from './UsersFilterBar'

describe('UsersFilterBar', () => {
  const setFilter = vi.fn()
  const resetFilters = vi.fn()

  beforeEach(() => { setFilter.mockClear(); resetFilters.mockClear() })

  function base(filters: Record<string, string> = {}) {
    const full = { q: '', role: '', status: '', language: '', activity: '', assigned_teacher: '', course: '', ...filters }
    return render(<UsersFilterBar filters={full} setFilter={setFilter} resetFilters={resetFilters} />)
  }

  it('updates the q filter when typing in search', () => {
    base()
    fireEvent.change(screen.getByLabelText('Search users'), { target: { value: 'aisha' } })
    expect(setFilter).toHaveBeenCalledWith('q', 'aisha')
  })

  it('shows placeholders for every filter dropdown', () => {
    base()
    expect(screen.getByText('Role: All')).toBeInTheDocument()
    expect(screen.getByText('Status: All')).toBeInTheDocument()
    expect(screen.getByText('Language: All')).toBeInTheDocument()
    expect(screen.getByText('Activity: All')).toBeInTheDocument()
    expect(screen.getByText('Teacher: All')).toBeInTheDocument()
    expect(screen.getByText('All Subjects')).toBeInTheDocument()
  })

  it('always renders Reset — disabled with no filters, enabled and active with filters', () => {
    const { rerender } = base()
    const reset = screen.getByRole('button', { name: /reset/i })
    expect(reset).toBeDisabled()

    rerender(
      <UsersFilterBar
        filters={{ q: '', role: 'student', status: '', language: '', activity: '', assigned_teacher: '', course: '' }}
        setFilter={setFilter}
        resetFilters={resetFilters}
      />,
    )
    const resetActive = screen.getByRole('button', { name: /reset/i })
    expect(resetActive).toBeEnabled()
    fireEvent.click(resetActive)
    expect(resetFilters).toHaveBeenCalled()
  })
})
