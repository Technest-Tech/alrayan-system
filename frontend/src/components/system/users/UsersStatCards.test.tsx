import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UsersStatCards } from './UsersStatCards'
import type { UserStats } from '@/types/system/user-directory'

const stats: UserStats = {
  total: 1222, students: 1187, teachers: 37, parents: 3, staff: 5,
  active: 429, inactive: 112, suspended: 0, archived: 653,
}

describe('UsersStatCards', () => {
  it('renders every stat value with its label', () => {
    render(<UsersStatCards stats={stats} />)
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('1222')).toBeInTheDocument()
    expect(screen.getByText('Students')).toBeInTheDocument()
    expect(screen.getByText('1187')).toBeInTheDocument()
    expect(screen.getByText('Archived')).toBeInTheDocument()
    expect(screen.getByText('653')).toBeInTheDocument()
  })

  it('shows skeletons while loading instead of values', () => {
    render(<UsersStatCards loading />)
    expect(screen.queryByText('1222')).not.toBeInTheDocument()
    expect(screen.getByText('Total Users')).toBeInTheDocument()
  })
})
