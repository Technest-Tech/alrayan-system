import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type BaseProps = {
  id: string
  label: string
  error?: string
  required?: boolean
}

type InputFieldProps = BaseProps & { as?: 'input' } & React.ComponentProps<'input'>
type TextareaFieldProps = BaseProps & { as: 'textarea' } & React.ComponentProps<'textarea'>
type SelectFieldProps = BaseProps & { as: 'select'; children: React.ReactNode } & React.ComponentProps<'select'>

type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps

export function FormField(props: FormFieldProps) {
  const { id, label, error, required, as, ...rest } = props

  const describedBy = error ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-primary">
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-hidden="true">
            *
          </span>
        )}
      </Label>

      {as === 'textarea' ? (
        <Textarea
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...(rest as React.ComponentProps<'textarea'>)}
        />
      ) : as === 'select' ? (
        <select
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            'h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-primary transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive ring-3 ring-destructive/20',
          )}
          {...(rest as React.ComponentProps<'select'>)}
        >
          {(props as SelectFieldProps).children}
        </select>
      ) : (
        <Input
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...(rest as React.ComponentProps<'input'>)}
        />
      )}

      {error && (
        <p id={`${id}-error`} role="alert" aria-live="polite" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
