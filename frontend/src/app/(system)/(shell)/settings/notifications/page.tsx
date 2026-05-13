import { PageHeader } from '@/components/system/primitives/PageHeader'
import { EmptyState } from '@/components/system/primitives/EmptyState'

export default function NotificationSettingsPage() {
  return (
    <>
      <PageHeader title="Notification Settings" description="Configure notifications." />
      <EmptyState
        icon="Bell"
        title="Notification Settings coming together"
        description="Notification settings will appear in SYS-10."
      />
    </>
  )
}
