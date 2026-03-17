import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

export function Button({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors",
        "focus:outline-none focus:ring-4 focus:ring-indigo-600/15",
        size === "sm" ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm",
        variant === "primary" &&
          "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 focus:ring-indigo-600/20",
        variant === "secondary" &&
          "border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50",
        variant === "ghost" && "text-gray-700 hover:bg-gray-50",
        className,
      )}
    />
  );
}

