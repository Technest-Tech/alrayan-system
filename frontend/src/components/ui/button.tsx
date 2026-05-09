import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-transparent font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Green — primary CTA
        default:
          "bg-secondary text-white hover:bg-[#0a6849] active:bg-[#085c40]",
        // Navy outline
        outline:
          "border-primary bg-transparent text-primary hover:bg-primary hover:text-white",
        // Gold — secondary accent
        gold:
          "bg-accent text-primary hover:bg-[#b8912d] active:bg-[#a6812a]",
        // Ghost
        ghost:
          "bg-transparent text-primary hover:bg-cream",
        // Destructive
        destructive:
          "bg-red-600 text-white hover:bg-red-700",
        // Link style
        link: "underline-offset-4 hover:underline text-secondary p-0 h-auto",
      },
      size: {
        default: "h-12 px-7 text-base",
        sm: "h-9 px-5 text-sm",
        lg: "h-14 px-8 text-lg",
        icon: "size-10",
        "icon-sm": "size-7",
        "icon-xs": "size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
