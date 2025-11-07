import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-zinc-100",
        success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/60",
        destructive: "bg-red-500/20 text-red-400 border-red-500/60",
        outline: "border-zinc-700 text-zinc-400",
        warning: "bg-amber-500/20 text-amber-300 border-amber-500/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };


