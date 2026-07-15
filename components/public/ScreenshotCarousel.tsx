"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Embla-powered screenshot carousel with a lightbox dialog.
 * Sources may be local /public paths or remote vendor URLs, so plain
 * <img> elements are used rather than next/image.
 */
export function ScreenshotCarousel({
  screenshots,
  productName,
}: {
  screenshots: string[];
  productName: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);
  const [lightbox, setLightbox] = React.useState<number | null>(null);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (screenshots.length === 0) return null;

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden rounded-3xl">
        <div className="flex gap-4">
          {screenshots.map((src, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Open screenshot ${index + 1} of ${productName}`}
              onClick={() => setLightbox(index)}
              className="group relative min-w-0 flex-[0_0_85%] cursor-zoom-in sm:flex-[0_0_60%] lg:flex-[0_0_48%]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${productName} screenshot ${index + 1}`}
                loading="lazy"
                className="aspect-[8/5] w-full rounded-3xl border border-zinc-200 object-cover dark:border-zinc-800"
              />
              <span className="absolute right-3 bottom-3 grid size-8 place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Expand className="size-4" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Carousel controls */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          aria-label="Previous screenshots"
          disabled={!canPrev}
          onClick={() => emblaApi?.scrollPrev()}
          className={cn(
            "grid size-9 place-items-center rounded-full border border-border transition-colors hover:bg-accent cursor-pointer",
            !canPrev && "pointer-events-none opacity-40"
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Next screenshots"
          disabled={!canNext}
          onClick={() => emblaApi?.scrollNext()}
          className={cn(
            "grid size-9 place-items-center rounded-full border border-border transition-colors hover:bg-accent cursor-pointer",
            !canNext && "pointer-events-none opacity-40"
          )}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Lightbox */}
      <Dialog open={lightbox !== null} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">
            {productName} screenshot {lightbox !== null ? lightbox + 1 : ""}
          </DialogTitle>
          {lightbox !== null && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={screenshots[lightbox]}
              alt={`${productName} screenshot ${lightbox + 1} (enlarged)`}
              className="w-full rounded-3xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
