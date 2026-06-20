'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { useMessageTemplates } from '@/hooks/system/useMessageTemplates'
import { TemplateEditor } from '@/components/system/notifications/TemplateEditor'
import type { MessageTemplate } from '@/types/system/messageTemplate'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/system/i18n'

export default function TemplatesPage() {
  const { t } = useI18n()
  const { data: templates, isLoading } = useMessageTemplates()
  const [selected, setSelected] = useState<MessageTemplate | null>(null)

  return (
    <>
      <PageHeader
        title={t('notifications.templates.title')}
        description={t('notifications.templates.subtitle')}
      />
      <div className="flex gap-6">
        {/* Template list */}
        <div className="w-72 shrink-0 border rounded divide-y overflow-hidden">
          {isLoading && <div className="p-4 text-sm text-muted-foreground">{t('common.loading')}</div>}
          {templates?.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => setSelected(tpl)}
              className={`w-full text-left px-4 py-3 hover:bg-secondary/50 ${selected?.id === tpl.id ? 'bg-secondary' : ''}`}
            >
              <p className="text-sm font-medium">{tpl.label}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-muted-foreground font-mono">{tpl.key}</span>
                {!tpl.is_active && <Badge variant="outline" className="text-xs">{t('status.inactive')}</Badge>}
              </div>
            </button>
          ))}
        </div>

        {/* Editor panel */}
        <div className="flex-1">
          {selected ? (
            <TemplateEditor key={selected.id} template={selected} onSaved={tpl => setSelected(tpl)} />
          ) : (
            <div className="text-muted-foreground text-sm p-4">{t('notifications.templates.selectPrompt')}</div>
          )}
        </div>
      </div>
    </>
  )
}
