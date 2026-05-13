'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useMessageTemplates } from '@/hooks/system/useMessageTemplates'
import { TemplateEditor } from '@/components/system/notifications/TemplateEditor'
import type { MessageTemplate } from '@/types/system/messageTemplate'
import { Badge } from '@/components/ui/badge'

export default function TemplatesPage() {
  const { data: templates, isLoading } = useMessageTemplates()
  const [selected, setSelected] = useState<MessageTemplate | null>(null)

  return (
    <>
      <PageHeader title="Message templates" description="Edit the body of outbound WhatsApp messages." />
      <div className="flex gap-6">
        {/* Template list */}
        <div className="w-72 shrink-0 border rounded divide-y overflow-hidden">
          {isLoading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
          {templates?.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={`w-full text-left px-4 py-3 hover:bg-secondary/50 ${selected?.id === t.id ? 'bg-secondary' : ''}`}
            >
              <p className="text-sm font-medium">{t.label}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-muted-foreground font-mono">{t.key}</span>
                {!t.is_active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
              </div>
            </button>
          ))}
        </div>

        {/* Editor panel */}
        <div className="flex-1">
          {selected ? (
            <TemplateEditor key={selected.id} template={selected} onSaved={t => setSelected(t)} />
          ) : (
            <div className="text-muted-foreground text-sm p-4">Select a template to edit.</div>
          )}
        </div>
      </div>
    </>
  )
}
