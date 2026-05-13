import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-secondary/10 text-secondary border border-secondary/20",
        secondary:
          "bg-primary/10 text-primary border border-primary/20",
        destructive:
          "bg-red-100 text-red-700 border border-red-200",
        warning:
          "bg-amber-100 text-amber-700 border border-amber-200",
        success:
          "bg-emerald-100 text-emerald-700 border border-emerald-200",
        outline:
          "border border-current bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
