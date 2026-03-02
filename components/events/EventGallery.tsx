"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface EventGalleryProps {
  images: string[];
  eventTitle: string;
}

export default function EventGallery({ images, eventTitle }: EventGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isOpen = activeIndex !== null;

  const prev = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : (i + 1) % images.length));
  }, [images.length]);

  const close = useCallback(() => setActiveIndex(null), []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")      close();
      if (e.key === "ArrowRight")  next();
      if (e.key === "ArrowLeft")   prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close, next, prev]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Focus close button when lightbox opens
  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  return (
    <>
      {/* Thumbnail grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        role="list"
        aria-label={`${eventTitle} photo gallery`}
      >
        {images.map((src, i) => (
          <motion.button
            key={`${src}-${i}`}
            role="listitem"
            onClick={() => setActiveIndex(i)}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            whileHover={{ scale: 1.03 }}
            className="aspect-square relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 cursor-zoom-in"
            aria-label={`View photo ${i + 1} of ${images.length} from ${eventTitle}`}
          >
            <Image
              src={src}
              alt={`${eventTitle} — photo ${i + 1}`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isOpen && activeIndex !== null && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm"
              onClick={close}
              aria-hidden="true"
            />

            {/* Dialog */}
            <motion.div
              key="lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={`Photo ${activeIndex + 1} of ${images.length} — ${eventTitle}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              {/* Image container */}
              <div
                className="relative max-w-5xl w-full pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full flex items-center justify-center" style={{ maxHeight: "80vh" }}>
                  <Image
                    src={images[activeIndex]}
                    alt={`${eventTitle} — photo ${activeIndex + 1}`}
                    width={1200}
                    height={800}
                    className="rounded-xl object-contain max-h-[80vh] w-auto"
                    priority
                  />
                </div>

                {/* Counter */}
                <p className="text-center mt-3 text-white/60 text-sm tabular-nums select-none">
                  {activeIndex + 1} / {images.length}
                </p>
              </div>
            </motion.div>

            {/* Navigation controls */}
            <div className="fixed inset-0 z-50 flex items-center justify-between px-3 pointer-events-none">
              <motion.button
                key="prev"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                onClick={prev}
                disabled={images.length <= 1}
                aria-label="Previous photo"
                className="pointer-events-auto p-3 rounded-full bg-black/50 hover:bg-black/75 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-20"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>

              <motion.button
                key="next"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                onClick={next}
                disabled={images.length <= 1}
                aria-label="Next photo"
                className="pointer-events-auto p-3 rounded-full bg-black/50 hover:bg-black/75 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-20"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Close button */}
            <motion.button
              key="close"
              ref={closeButtonRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              aria-label="Close lightbox"
              className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-black/50 hover:bg-black/75 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
