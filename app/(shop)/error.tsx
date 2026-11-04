"use client";

import { ButtonLink } from "@/components/button-link";

export default function ShopError({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="mx-auto flex max-w-site flex-col items-center gap-6 px-(--za-gutter) py-[clamp(80px,10vw,160px)] text-center">
      <h1 className="font-display text-h2">We couldn’t load this right now</h1>
      <p className="max-w-[420px] text-base leading-[1.7] text-copy">
        Something went wrong on our side. Please try again in a moment.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => retry()}
          className="cursor-pointer bg-ink px-[34px] py-[18px] text-small font-normal uppercase tracking-button text-white transition-colors hover:bg-accent"
        >
          Try again
        </button>
        <ButtonLink href="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
