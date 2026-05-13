'use client'
import { PageHeader } from '@/components/system/primitives/PageHeader'
import { WassenderSettings } from '@/components/system/settings/WassenderSettings'

export default function WassenderSettingsPage() {
  return (
    <>
      <PageHeader title="Wassender" description="Configure WhatsApp integration via Wassender." />
      <WassenderSettings />
    </>
  )
}
