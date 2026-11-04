import Link from "next/link";

type CategoryRowProps = { items: { href: string; label: string; accent?: boolean }[] };

/** Desktop-only row of shop categories, spread evenly. */
export function CategoryRow({ items }: CategoryRowProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Shop categories" className="border-t border-[#F1F1F1] max-nav:hidden">
      <ul className="mx-auto flex max-w-site items-center justify-between gap-[clamp(18px,3vw,40px)] overflow-x-auto px-(--za-gutter) py-[22px] text-[clamp(11px,1.05vw,13px)] font-normal uppercase tracking-[0.16em] whitespace-nowrap">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={item.accent ? "text-accent hover:underline" : "hover:text-accent"}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
