import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { DirectoryUser, StudentProfile, TeacherProfile } from '@/types/system/user-directory'

const createMock = vi.fn().mockResolvedValue({})
const updateMock = vi.fn().mockResolvedValue({})

vi.mock('@/hooks/system/useUserDirectory', () => ({
  useCreateUser: () => ({ mutateAsync: createMock, isPending: false }),
  useUpdateUser: () => ({ mutateAsync: updateMock, isPending: false }),
}))
vi.mock('@/hooks/system/useCourses', () => ({ useCourses: () => ({ data: [] }) }))
vi.mock('@/hooks/system/useTeachers', () => ({ useTeachers: () => ({ data: { data: [] } }) }))
vi.mock('@/hooks/system/useGuardians', () => ({ useGuardians: () => ({ data: [] }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { UserFormDialog } from './UserFormDialog'

function baseUser(over: Partial<DirectoryUser> = {}): DirectoryUser {
  return {
    id: 1, name: 'Aisha', email: 'aisha@example.com', phone: null, whatsapp: null,
    role: 'student', status: 'active', is_active: true, language: 'en', birthday: null,
    gender: null, photo_url: null, notes: null, documents: null,
    emails: [{ email: 'aisha@example.com', is_primary: true }], phones: [],
    last_login_at: null, invite_pending: false, created_at: null, profile: null, ...over,
  }
}

const studentProfile: StudentProfile = {
  id: 9, student_type: 'adult', country: 'EG', timezone: 'Africa/Cairo', status: 'active',
  sessions_per_month: 8, session_duration_min: 30, currency: 'USD', monthly_price_minor: 0,
  course: null, assigned_teacher: null, guardian: null,
}
const teacherProfile: TeacherProfile = {
  id: 3, qualifications: 'MA', payment_method: 'instapay', hourly_rate: 300,
  currency: 'EUR', accepts_new_students: true,
  teachable_course_ids: [], is_active: true, students_count: 0,
}

describe('UserFormDialog', () => {
  beforeEach(() => { createMock.mockClear(); updateMock.mockClear() })

  it('renders the exact three-section layout in create mode', () => {
    render(<UserFormDialog open onOpenChange={vi.fn()} />)
    expect(screen.getByText('Create New User')).toBeInTheDocument()
    expect(screen.getByText('Personal Information')).toBeInTheDocument()
    expect(screen.getByText('Documents & Additional Info')).toBeInTheDocument()
    expect(screen.getByText('Account Settings')).toBeInTheDocument()
    expect(screen.getByText('Upload Photo')).toBeInTheDocument()
    expect(screen.getByText('Add Email')).toBeInTheDocument()
    expect(screen.getByText('Add Phone')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
  })

  it('blocks an empty create with role and name errors', () => {
    render(<UserFormDialog open onOpenChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }))
    expect(screen.getByText('Role is required')).toBeInTheDocument()
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('shows Student Information (not Teacher Information) when editing a student', () => {
    render(<UserFormDialog open onOpenChange={vi.fn()} user={baseUser({ role: 'student', profile: studentProfile })} />)
    expect(screen.getByText('Edit User')).toBeInTheDocument()
    expect(screen.getByText('Student Information')).toBeInTheDocument()
    expect(screen.queryByText('Teacher Information')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('John Doe')).toHaveValue('Aisha')
  })

  it('shows Teacher Information (not Student Information) when editing a teacher', () => {
    render(<UserFormDialog open onOpenChange={vi.fn()} user={baseUser({ role: 'teacher', name: 'Omar', profile: teacherProfile })} />)
    expect(screen.getByText('Teacher Information')).toBeInTheDocument()
    expect(screen.queryByText('Student Information')).not.toBeInTheDocument()
  })

  it('validates required student fields on save', () => {
    render(<UserFormDialog open onOpenChange={vi.fn()} user={baseUser({ role: 'student', profile: studentProfile })} />)
    fireEvent.change(screen.getByPlaceholderText('EG'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update User' }))
    expect(screen.getByText('Country is required')).toBeInTheDocument()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('saves edits for a valid student', async () => {
    const onOpenChange = vi.fn()
    render(<UserFormDialog open onOpenChange={onOpenChange} user={baseUser({ role: 'student', profile: studentProfile })} />)
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Aisha Updated' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update User' }))

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1))
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      data: expect.objectContaining({ role: 'student', name: 'Aisha Updated' }),
    }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
