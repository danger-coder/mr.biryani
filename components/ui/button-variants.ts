import { cva, type VariantProps } from "class-variance-authority";

/**
 * Kept in its own module (no "use client") so server components can call it to
 * style `<Link>` elements as buttons.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,color,border-color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px select-none",
  {
    variants: {
      variant: {
        // Customer site
        primary:
          "bg-saffron-400 text-charcoal-900 hover:bg-saffron-300 shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset]",
        outline:
          "border border-current/25 bg-transparent hover:border-current/50 hover:bg-current/5",
        ghost: "bg-transparent hover:bg-current/8",
        dark: "bg-charcoal-900 text-cream-100 hover:bg-charcoal-800",
        cream: "bg-cream-100 text-charcoal-900 hover:bg-white",
        // Admin
        solid: "bg-slate-900 text-white hover:bg-slate-800",
        secondary:
          "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400",
        danger: "bg-red-600 text-white hover:bg-red-700",
        success: "bg-emerald-600 text-white hover:bg-emerald-700",
        link: "bg-transparent underline underline-offset-4 hover:opacity-70 px-0",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "h-12 px-7 text-sm rounded-full",
        xl: "h-14 px-9 text-base rounded-full",
        icon: "h-9 w-9 rounded-lg",
        "icon-sm": "h-7 w-7 rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
