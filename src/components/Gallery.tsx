import { useState } from "react";

type Slide = { src: string; alt: string };

// Lightweight slideshow, no external deps. One large image, prev/next
// arrows, and dot indicators.
export default function Gallery({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const go = (n: number) => setI((n + slides.length) % slides.length);

  return (
    <div className="reveal">
      <div className="relative rounded-2xl overflow-hidden bg-green-900 aspect-[16/10]">
        {slides.map((s, idx) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            loading={idx === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              idx === i ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        ))}
        <button
          type="button"
          aria-label="Previous photo"
          onClick={() => go(i - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-xl transition"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next photo"
          onClick={() => go(i + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-xl transition"
        >
          ›
        </button>
      </div>
      <div className="flex justify-center gap-2 mt-4">
        {slides.map((s, idx) => (
          <button
            key={s.src}
            type="button"
            aria-label={`Show photo ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === i ? "w-6 bg-green-700" : "w-2 bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
