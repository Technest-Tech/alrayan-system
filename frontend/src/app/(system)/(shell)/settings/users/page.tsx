'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { UserTable } from '@/components/system/settings/users/UserTable'
import { InviteUserSheet } from '@/components/system/settings/users/InviteUserSheet'

export default function UsersPage() {
  const [inviting, setInviting] = useState(false)

  return (
    <>
      <PageHeader
        title="Users"
        description="Admins, supervisors, and teacher accounts."
        actions={
          <button
            onClick={() => setInviting(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'rgb(14 124 90)' }}
          >
            + Invite user
          </button>
        }
      />

      <div className="mt-6">
        <UserTable />
      </div>

      {inviting && <InviteUserSheet onClose={() => setInviting(false)} />}
    </>
  )
}
