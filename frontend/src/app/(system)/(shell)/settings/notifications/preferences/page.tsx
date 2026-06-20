'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { PreferenceMatrix } from '@/components/system/notifications/PreferenceMatrix'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/system/useNotificationPreferences'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/system/i18n'

export default function NotificationPreferencesPage() {
  const { t } = useI18n()
  const { data, isLoading } = useNotificationPreferences()
  const update = useUpdateNotificationPreferences()
  const [muted, setMuted] = useState<string[]>([])

  useEffect(() => { if (data) setMuted(data.muted_types) }, [data])

  const handleSave = async () => {
    await update.mutateAsync(muted)
    toast.success(t('settings.notifications.preferences.savedToast'))
  }

  return (
    <>
      <PageHeader title={t('settings.notifications.preferences.title')} description={t('settings.notifications.preferences.subtitle')} />
      {isLoading ? (
        <p className="text-sm text-muted-foreground p-4">{t('common.loading')}</p>
      ) : (
        <div className="max-w-lg space-y-6">
          <PreferenceMatrix
            allTypes={data?.all_types ?? {}}
            mutedTypes={muted}
            onChange={setMuted}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMuted(data?.muted_types ?? [])}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={update.isPending}>
              {update.isPending ? t('common.saving') : t('settings.notifications.preferences.save')}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
