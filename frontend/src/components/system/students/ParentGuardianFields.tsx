'use client'
import type { Control, UseFormSetValue } from 'react-hook-form'
import { GuardianSelector } from './GuardianSelector'

interface ParentGuardianFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>
  syncDialCode?: string
}

export function ParentGuardianFields({ control, setValue, syncDialCode }: ParentGuardianFieldsProps) {
  return <GuardianSelector control={control} setValue={setValue} syncDialCode={syncDialCode} />
}
