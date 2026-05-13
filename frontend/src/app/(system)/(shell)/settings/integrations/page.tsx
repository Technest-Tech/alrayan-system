import { PageHeader } from '@/components/system/primitives/PageHeader'
import { EmptyState } from '@/components/system/primitives/EmptyState'

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader title="Integrations" description="Third-party integrations." />
      <EmptyState
        icon="Plug"
        title="Integrations coming together"
        description="Integration settings will appear in SYS-10."
      />
    </>
  )
}
