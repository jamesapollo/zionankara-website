import { ButtonLink } from "@/components/button-link";

/** Shared body of the 404 pages. */
export function NotFoundContent() {
  return (
    <div className="mx-auto flex max-w-site flex-col items-center gap-6 px-(--za-gutter) py-[clamp(80px,10vw,160px)] text-center">
      <span className="text-label font-normal uppercase tracking-[0.28em] text-accent">404</span>
      <h1 className="font-display text-h2 text-balance">This page could not be found</h1>
      <p className="max-w-[420px] text-base leading-[1.7] text-copy">
        The page may have moved or no longer exists. Let us take you somewhere lovely instead.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/collections" variant="secondary">
          Shop collections
        </ButtonLink>
      </div>
    </div>
  );
}
