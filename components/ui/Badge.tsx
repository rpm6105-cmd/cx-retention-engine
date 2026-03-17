import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  const tones: Record<BadgeTone, { pill: string; dot: string }> = {
    neutral: { pill: "bg-gray-100 text-gray-700 ring-gray-200", dot: "bg-gray-500" },
    warning: { pill: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
    danger: { pill: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
    success: { pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  };

  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        tones[tone].pill,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tones[tone].dot)} aria-hidden="true" />
      {props.children}
    </span>
  );
}

