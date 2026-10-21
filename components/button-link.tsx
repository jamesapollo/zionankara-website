import Link from "next/link";
import type { ComponentProps } from "react";

const variants = {
  primary: "bg-ink text-white hover:bg-accent",
  secondary: "border border-ink hover:bg-ink hover:text-white",
  "on-dark": "bg-white text-ink hover:bg-accent-soft",
} as const;

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  /**
   * Padding/height classes. Passed separately rather than through className because conflicting
   * Tailwind utilities resolve by stylesheet order, not class order.
   */
  pad?: string;
};

/** Square-cornered call-to-action link, per the style guide's button component. */
export function ButtonLink({ variant = "primary", pad, className = "", ...props }: ButtonLinkProps) {
  // The secondary border takes 1px, so its default vertical padding is 1px less to keep heights equal.
  const padding = pad ?? (variant === "secondary" ? "px-[34px] py-[17px]" : "px-[34px] py-[18px]");
  return (
    <Link
      className={`inline-flex items-center justify-center text-small font-normal uppercase tracking-button transition-colors ${padding} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

/** Underlined uppercase text link ("All collections"). */
export function TextLink({ className = "", ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`border-b border-current pb-1 text-small font-normal uppercase tracking-button hover:text-accent ${className}`}
      {...props}
    />
  );
}
