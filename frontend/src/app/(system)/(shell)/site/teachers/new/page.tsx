'use client'

import { PageHeader } from '@/components/system/primitives/PageHeader'
import { LinkButton } from '@/components/ui/link-button'
import { SiteTeacherEditor } from '@/components/system/site/SiteTeacherEditor'

export default function NewSiteTeacherPage() {
  return (
    <>
      <PageHeader title="Add teacher" description="Create a new teacher profile for the public website.">
        <LinkButton variant="ghost" href="/site/teachers">← Back</LinkButton>
      </PageHeader>
      <SiteTeacherEditor />
    </>
  )
}
