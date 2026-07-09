'use client'
import { Badge } from '@/components/ui/badge'
import { useWhatsAppConnectionStatus } from '@/hooks/system/useWhatsAppSendLogs'
import { useI18n } from '@/lib/system/i18n'

export function ConnectionStatusBadge() {
  const { t } = useI18n()
  const { data, isLoading, isError } = useWhatsAppConnectionStatus()

  if (isLoading) {
    return <Badge variant="outline">{t('whatsappLogs.connection.checking')}</Badge>
  }

  if (isError || !data) {
    return <Badge variant="destructive">{t('whatsappLogs.connection.unknown')}</Badge>
  }

  return (
    <Badge variant={data.connected ? 'default' : 'destructive'}>
      {data.connected
        ? t('whatsappLogs.connection.connected')
        : t('whatsappLogs.connection.disconnected', { status: data.status })}
    </Badge>
  )
}
