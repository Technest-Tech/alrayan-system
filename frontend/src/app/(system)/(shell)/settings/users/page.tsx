'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { UserTable } from '@/components/system/settings/users/UserTable'
import { InviteUserSheet } from '@/components/system/settings/users/InviteUserSheet'
import { useI18n } from '@/lib/system/i18n'

export default function UsersPage() {
  const { t } = useI18n()
  const [inviting, setInviting] = useState(false)

  return (
    <>
      <PageHeader
        title={t('users.title')}
        description={t('users.settingsSubtitle')}
        actions={
          <button
            onClick={() => setInviting(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'rgb(14 124 90)' }}
          >
            {t('users.inviteUser')}
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
