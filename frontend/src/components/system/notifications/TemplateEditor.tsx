'use client'
import { useState, useRef } from 'react'
import type { MessageTemplate } from '@/types/system/messageTemplate'
import { useUpdateMessageTemplate, useTemplatePreview } from '@/hooks/system/useMessageTemplates'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { VariableChip } from './VariableChip'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface Props {
  template: MessageTemplate
  onSaved: (t: MessageTemplate) => void
}

export function TemplateEditor({ template, onSaved }: Props) {
  const [body, setBody] = useState(template.body)
  const [label, setLabel] = useState(template.label)
  const [isActive, setIsActive] = useState(template.is_active)
  const [preview, setPreview] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const update = useUpdateMessageTemplate(template.id)
  const previewMutation = useTemplatePreview(template.id)

  const insertVariable = (v: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const token = `{${v}}`
    const next = body.slice(0, start) + token + body.slice(end)
    setBody(next)
    setTimeout(() => {
      el.selectionStart = start + token.length
      el.selectionEnd = start + token.length
      el.focus()
    }, 0)
  }

  const handleSave = async () => {
    const saved = await update.mutateAsync({ body, label, is_active: isActive })
    toast.success('Template saved.')
    onSaved(saved)
  }

  const handlePreview = async () => {
    const vars = template.example_values ?? {}
    const result = await previewMutation.mutateAsync(vars)
    setPreview(result.rendered)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-muted-foreground">{template.key}</span>
        <Badge variant="outline">{template.channel}</Badge>
        {!isActive && <Badge variant="outline" className="text-yellow-600">Inactive</Badge>}
        <label className="ml-auto flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="h-4 w-4"
          />
          Active
        </label>
      </div>

      <div className="space-y-1">
        <Label>Label</Label>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          className="w-full h-9 text-sm border rounded px-3"
        />
      </div>

      <div className="space-y-2">
        <Label>Body</Label>
        {template.available_variables.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {template.available_variables.map(v => (
              <VariableChip key={v} variable={v} onClick={insertVariable} />
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          rows={8}
          value={body}
          onChange={e => setBody(e.target.value)}
          className="w-full text-sm border rounded px-3 py-2 font-mono resize-y"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="outline" onClick={handlePreview} disabled={previewMutation.isPending}>
          Preview
        </Button>
      </div>

      {preview !== null && (
        <div className="space-y-1">
          <Label>Preview</Label>
          <div className="bg-muted rounded p-4 text-sm whitespace-pre-wrap font-mono border">
            {preview}
          </div>
          <button onClick={() => setPreview(null)} className="text-xs text-muted-foreground hover:underline">
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
