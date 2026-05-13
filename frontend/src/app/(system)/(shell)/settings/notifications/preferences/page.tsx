'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { PreferenceMatrix } from '@/components/system/notifications/PreferenceMatrix'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/system/useNotificationPreferences'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function NotificationPreferencesPage() {
  const { data, isLoading } = useNotificationPreferences()
  const update = useUpdateNotificationPreferences()
  const [muted, setMuted] = useState<string[]>([])

  useEffect(() => { if (data) setMuted(data.muted_types) }, [data])

  const handleSave = async () => {
    await update.mutateAsync(muted)
    toast.success('Preferences saved.')
  }

  return (
    <>
      <PageHeader title="Notification preferences" description="Choose which alerts you receive in the bell." />
      {isLoading ? (
        <p className="text-sm text-muted-foreground p-4">Loading…</p>
      ) : (
        <div className="max-w-lg space-y-6">
          <PreferenceMatrix
            allTypes={data?.all_types ?? {}}
            mutedTypes={muted}
            onChange={setMuted}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMuted(data?.muted_types ?? [])}>Cancel</Button>
            <Button onClick={handleSave} disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save preferences'}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
