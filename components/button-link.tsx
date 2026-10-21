import Link from "next/link";
import type { ComponentProps } from "react";

const variants = {
  primary: "bg-ink text-white hover:bg-accent",
  secondary: "border border-ink py-[17px] hover:bg-ink hover:text-white",
  "on-dark": "bg-white text-ink hover:bg-accent-soft",
} as const;

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
};

/** Square-cornered call-to-action link, per the style guide's button component. */
export function ButtonLink({ variant = "primary", className = "", ...props }: ButtonLinkProps) {
  return (
    <Link
      className={`inline-block px-[34px] py-[18px] text-small font-normal uppercase tracking-button transition-colors ${variants[variant]} ${className}`}
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
