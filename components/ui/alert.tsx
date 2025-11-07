import * as React from "react";

import { cn } from "../../lib/utils";

export type AlertVariant = "default" | "success" | "info" | "destructive";

const variantStyles: Record<AlertVariant, string> = {
  default: "border-zinc-800 bg-zinc-900/70 text-zinc-200",
  success: "border-emerald-500/60 bg-emerald-500/10 text-emerald-300",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  destructive: "border-red-500/60 bg-red-500/10 text-red-300",
};

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }>(
  ({ className, variant = "default", ...props }, ref) => (
    <div ref={ref} role="alert" className={cn("flex w-full items-start gap-3 rounded-lg border px-4 py-3", variantStyles[variant], className)} {...props} />
  ),
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h5 ref={ref} className={cn("text-sm font-semibold", className)} {...props} />,
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm leading-relaxed", className)} {...props} />,
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription, AlertTitle };


