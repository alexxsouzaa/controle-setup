import { cn } from "@/lib/utils"

/** @param {any} props */
function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-xl bg-muted", className)}
      {...props} />
  );
}

export { Skeleton }
