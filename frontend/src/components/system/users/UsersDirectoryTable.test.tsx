import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UsersDirectoryTable } from './UsersDirectoryTable'
import type { DirectoryUser } from '@/types/system/user-directory'

function makeUser(over: Partial<DirectoryUser> = {}): DirectoryUser {
  return {
    id: 1, name: 'Clara Balbo', email: 'clara@example.com', phone: null, whatsapp: '+33611',
    role: 'student', status: 'active', is_active: true, language: 'en', birthday: null,
    gender: null, photo_url: null, notes: null, documents: null, last_login_at: null,
    invite_pending: false, created_at: null,
    profile: { id: 9, student_type: 'adult', country: 'FR', timezone: 'Europe/Paris', status: 'active',
      sessions_per_month: 8, session_duration_min: 30, currency: 'EUR', monthly_price_minor: 5000,
      course: { id: 2, name: 'French' }, assigned_teacher: { id: 5, name: 'Sara Ahmed' }, guardian: null },
    ...over,
  }
}

const noop = { onView: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn(), onPage: vi.fn(), onPerPage: vi.fn(), perPage: 20 }

describe('UsersDirectoryTable', () => {
  it('renders the reference columns: name, teacher, email, role, status, sections', () => {
    render(<UsersDirectoryTable data={[makeUser()]} isLoading={false} {...noop} />)
    expect(screen.getByText('Clara Balbo')).toBeInTheDocument()
    expect(screen.getByText('Sara Ahmed')).toBeInTheDocument()       // Teachers
    expect(screen.getByText('clara@example.com')).toBeInTheDocument() // Email
    expect(screen.getByText('student')).toBeInTheDocument()           // Role
    expect(screen.getByText('active')).toBeInTheDocument()            // Status
    expect(screen.getByText('French')).toBeInTheDocument()            // Sections (course)
  })

  it('shows the empty state when there are no users', () => {
    render(<UsersDirectoryTable data={[]} isLoading={false} {...noop} />)
    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('fires view, edit and delete from the action buttons', () => {
    const onView = vi.fn(), onEdit = vi.fn(), onDelete = vi.fn()
    render(<UsersDirectoryTable data={[makeUser()]} isLoading={false} {...noop} onView={onView} onEdit={onEdit} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('View Clara Balbo'))
    fireEvent.click(screen.getByLabelText('Edit Clara Balbo'))
    fireEvent.click(screen.getByLabelText('Delete Clara Balbo'))
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })

  it('paginates via the meta footer', () => {
    const onPage = vi.fn()
    render(
      <UsersDirectoryTable
        data={[makeUser()]}
        meta={{ current_page: 1, last_page: 3, per_page: 20, total: 45 }}
        isLoading={false}
        {...noop}
        onPage={onPage}
      />,
    )
    expect(screen.getByText('Showing 1–20 of 45')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Next'))
    expect(onPage).toHaveBeenCalledWith(2)
  })
})
