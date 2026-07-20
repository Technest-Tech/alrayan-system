'use client'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useI18n } from '@/lib/system/i18n'
import { CategoriesTab } from './settings/CategoriesTab'
import { SpecialRulesTab } from './settings/SpecialRulesTab'
import { AssignmentsTab } from './settings/AssignmentsTab'

const BORDER = 'rgb(var(--border-default,229 233 240))'
const NAVY   = 'rgb(11 31 58)'

export function QcSettingsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useI18n()

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            className="relative pointer-events-auto w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 20px 60px rgb(0 0 0 / 0.18)' }}
          >
            <div className="shrink-0 relative flex items-center justify-center px-6 py-4 border-b" style={{ borderColor: BORDER }}>
              <h3 className="text-lg font-bold" style={{ color: NAVY }}>⚙️ {t('qualityControl.settingsModal.title')}</h3>
              <button onClick={() => onOpenChange(false)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity" aria-label={t('qualityControl.settingsModal.close')}>
                <X size={18} />
              </button>
            </div>

            <Tabs defaultValue="categories" className="flex flex-col min-h-0 flex-1">
              <div className="shrink-0 px-6 pt-3">
                <TabsList>
                  <TabsTrigger value="categories">{t('qualityControl.settingsModal.tabCategories')}</TabsTrigger>
                  <TabsTrigger value="rules">{t('qualityControl.settingsModal.tabSpecialRules')}</TabsTrigger>
                  <TabsTrigger value="assignments">{t('qualityControl.settingsModal.tabAssignments')}</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <TabsContent value="categories"><CategoriesTab /></TabsContent>
                <TabsContent value="rules"><SpecialRulesTab /></TabsContent>
                <TabsContent value="assignments"><AssignmentsTab /></TabsContent>
              </div>
            </Tabs>

            <div className="shrink-0 flex items-center justify-center px-6 py-3 border-t" style={{ borderColor: BORDER }}>
              <button
                onClick={() => onOpenChange(false)}
                className="px-5 py-2 rounded-xl text-sm font-medium border hover:bg-black/5 transition-colors"
                style={{ borderColor: BORDER, color: NAVY }}
              >
                {t('qualityControl.settingsModal.close')}
              </button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
