import Link from "next/link";
import { Fragment } from "react";

type Crumb = { label: string; href?: string };

/** Uppercase trail; the last crumb is the current page and is not linked. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2.5 text-label font-normal uppercase tracking-[0.2em] text-muted">
      {items.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 && <span aria-hidden>/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-accent">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-ink">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
