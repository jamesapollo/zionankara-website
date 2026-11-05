"use client";

import Image from "next/image";
import { useState } from "react";

// One photo per product for now, so the extra views are zoomed crops of it.
// Swap these for real side/back/detail photography when it exists.
const views = [
  { label: "Full look", className: "object-top" },
  { label: "Upper detail", className: "object-top scale-[1.6] origin-top" },
  { label: "Print close-up", className: "object-center scale-[2.4]" },
];

type Photo = { url: string; alt: string; width: number; height: number };

/** `photos` (ERP) shows the real photographs; otherwise the single local `image` is shown with zoomed crops. */
type ProductGalleryProps = { image?: string; photos?: Photo[]; name: string; badge?: string };

export function ProductGallery({ image, photos, name, badge }: ProductGalleryProps) {
  if (photos) return <PhotoGallery photos={photos} name={name} badge={badge} />;
  return <CropGallery image={image ?? ""} name={name} badge={badge} />;
}

const badgeClass =
  "absolute top-[18px] left-[18px] bg-accent px-3 py-[7px] text-[11px] font-medium uppercase tracking-[0.16em] text-white";

/** The product's own photographs; the parent remounts this (via `key`) when the photo set changes. */
function PhotoGallery({ photos, name, badge }: { photos: Photo[]; name: string; badge?: string }) {
  const [active, setActive] = useState(0);
  const current = photos[active] ?? photos[0];

  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative aspect-product overflow-hidden bg-tint">
        {current && (
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt || name}
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            loading="eager"
            fetchPriority="high"
            className="object-cover object-top"
          />
        )}
        {badge && <span className={badgeClass}>{badge}</span>}
      </div>
      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-3.5">
          {photos.map((photo, i) => (
            <button
              key={photo.url}
              type="button"
              aria-label={`Show photo ${i + 1} of ${photos.length}`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={`relative aspect-product cursor-pointer overflow-hidden bg-tint outline-offset-2 ${i === active ? "outline outline-ink" : "outline outline-transparent"}`}
            >
              <Image src={photo.url} alt="" fill sizes="140px" loading="eager" className="object-cover object-top" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CropGallery({ image, name, badge }: { image: string; name: string; badge?: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative aspect-product overflow-hidden bg-tint">
        {/* Only the active view is mounted: hidden zoomed copies would otherwise be picked as the LCP element. */}
        <Image
          key={views[active].label}
          src={image}
          alt={active === 0 ? name : `${name} — ${views[active].label.toLowerCase()}`}
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          loading="eager"
          fetchPriority="high"
          className={`object-cover ${views[active].className}`}
        />
        {badge && <span className={badgeClass}>{badge}</span>}
      </div>
      <div className="grid grid-cols-4 gap-3.5">
        {views.map((view, i) => (
          <button
            key={view.label}
            type="button"
            aria-label={`Show ${view.label.toLowerCase()}`}
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className={`relative aspect-product cursor-pointer overflow-hidden bg-tint outline-offset-2 ${i === active ? "outline outline-ink" : "outline outline-transparent"}`}
          >
            <Image src={image} alt="" fill sizes="140px" loading="eager" className={`object-cover ${view.className}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
