'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { LinkButton } from '@/components/ui/link-button'
import { Button } from '@/components/ui/button'
import { SiteTeacherEditor } from '@/components/system/site/SiteTeacherEditor'
import { useSiteTeacher, useDeleteSiteTeacher } from '@/hooks/system/useSiteTeachers'

export default function EditSiteTeacherPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const { data: teacher, isLoading } = useSiteTeacher(slug)
  const del = useDeleteSiteTeacher()

  async function onDelete() {
    if (!confirm('Delete this teacher and all their reviews? This cannot be undone.')) return
    try {
      await del.mutateAsync(slug)
      toast.success('Teacher deleted')
      router.push('/site/teachers')
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <>
      <PageHeader title={teacher?.name ?? 'Edit teacher'} description={teacher?.role}>
        <a
          href={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/our-teachers/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button type="button" variant="ghost">View on site ↗</Button>
        </a>
        <Button type="button" variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" /> Delete
        </Button>
        <LinkButton variant="ghost" href="/site/teachers">← Back</LinkButton>
      </PageHeader>

      {isLoading || !teacher ? (
        <p className="text-sm text-muted-text">Loading…</p>
      ) : (
        <SiteTeacherEditor teacher={teacher} />
      )}
    </>
  )
}
