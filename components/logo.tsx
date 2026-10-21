type LogoProps = { className?: string; accentClassName?: string };

export function Logo({ className = "text-[32px]", accentClassName = "text-accent" }: LogoProps) {
  return (
    <span className={`font-display font-medium leading-none tracking-[0.04em] ${className}`}>
      Zion<em className={accentClassName}>ankara</em>
    </span>
  );
}
