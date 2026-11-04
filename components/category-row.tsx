import Link from "next/link";

type CategoryRowProps = { items: { href: string; label: string; accent?: boolean }[] };

/** Desktop-only row of shop categories, spread evenly. */
export function CategoryRow({ items }: CategoryRowProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Shop categories" className="border-t border-line max-nav:hidden">
      <ul className="mx-auto flex max-w-site items-center justify-between gap-6 overflow-x-auto px-(--za-gutter) py-3 text-small uppercase tracking-[0.14em] whitespace-nowrap">
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
