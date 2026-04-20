"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@conductor/ui";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

const MAX_VISIBLE_COLUMNS_MOBILE = 2;
const MAX_VISIBLE_COLUMNS_DESKTOP = 4;

interface KanbanCarouselProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderColumn: (item: T) => ReactNode;
  fillHeight?: boolean;
}

export function KanbanCarousel<T>({
  items,
  getKey,
  renderColumn,
  fillHeight = false,
}: KanbanCarouselProps<T>) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const maxVisibleColumns = isDesktop
    ? MAX_VISIBLE_COLUMNS_DESKTOP
    : MAX_VISIBLE_COLUMNS_MOBILE;

  const needsCarousel = items.length > maxVisibleColumns;

  const slidesToScroll = 1;
  const slideSize = 100 / maxVisibleColumns;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: needsCarousel,
    align: "start",
    slidesToScroll,
    containScroll: false,
    active: needsCarousel,
  });

  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [emblaApi, maxVisibleColumns, needsCarousel]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div
      className={`flex w-full items-stretch gap-0 ${
        fillHeight ? "min-h-0 min-w-0 flex-1" : ""
      }`}
    >
      {needsCarousel && (
        <div className="flex flex-shrink-0 items-center pr-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full transition-[transform,background-color]"
            onClick={scrollPrev}
          >
            <IconChevronLeft size={18} />
          </Button>
        </div>
      )}
      <div
        ref={emblaRef}
        className={`w-full overflow-hidden ${
          fillHeight ? "min-h-0 min-w-0 flex-1" : ""
        }`}
      >
        <div
          className={`flex items-stretch ${fillHeight ? "h-full" : ""}`}
          style={{ gap: isDesktop ? "0.75rem" : "0.5rem" }}
        >
          {items.map((item) => (
            <div
              key={getKey(item)}
              className={`flex min-w-0 flex-shrink-0 self-stretch ${
                fillHeight ? "h-full" : ""
              }`}
              style={{
                flexBasis: needsCarousel
                  ? `calc(${slideSize}% - ${(isDesktop ? 0.75 : 0.5) * ((maxVisibleColumns - 1) / maxVisibleColumns)}rem)`
                  : undefined,
                flex: needsCarousel ? "0 0 auto" : "1 1 0%",
              }}
            >
              {renderColumn(item)}
            </div>
          ))}
        </div>
      </div>
      {needsCarousel && (
        <div className="flex flex-shrink-0 items-center pl-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full transition-[transform,background-color]"
            onClick={scrollNext}
          >
            <IconChevronRight size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}
