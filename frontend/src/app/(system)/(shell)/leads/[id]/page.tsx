'use client'
import { use } from 'react'
import { useLead } from '@/hooks/system/useLeads'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { LeadProfile } from '@/components/system/leads/LeadProfile'
import { FollowUpList } from '@/components/system/leads/FollowUpList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { LinkButton } from '@/components/ui/link-button'

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: lead, isLoading } = useLead(id)

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!lead) return <div className="p-8 text-muted-foreground">Lead not found.</div>

  return (
    <>
      <PageHeader title={lead.name} description={`${(lead.source ?? '').replace('_', ' ')} · ${lead.country ?? '—'}`}>
        <div className="flex items-center gap-2">
          <LinkButton variant="ghost" href="/leads">← Leads</LinkButton>
          <Badge variant={lead.status === 'lost' ? 'destructive' : lead.status === 'closed' ? 'default' : 'secondary'}>
            {lead.status.replace('_', ' ')}
          </Badge>
        </div>
      </PageHeader>

      <div className="max-w-3xl">
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="followups">Follow-ups</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="pt-4">
            <LeadProfile lead={lead} />
          </TabsContent>
          <TabsContent value="followups" className="pt-4">
            <FollowUpList leadId={Number(id)} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
