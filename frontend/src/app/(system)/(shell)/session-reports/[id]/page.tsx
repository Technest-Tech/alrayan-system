import { PageHeader } from '@/components/system/primitives/PageHeader'

export default function SessionReportDetailPage() {
  return (
    <>
      <PageHeader title="Session report" description="Read-only view of a submitted report." />
      <div className="text-sm text-muted-foreground">
        Report detail loaded by session context — navigate from the session-reports list.
      </div>
    </>
  )
}
