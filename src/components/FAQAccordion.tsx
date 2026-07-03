import { useState } from "react";
import type { FAQ } from "@/data/faqs";

export default function FAQAccordion({ items }: { items: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="max-w-[820px] mx-auto">
      {items.map((f, i) => {
        const open = openIndex === i;
        return (
          <div key={i} className="border-b border-[var(--line)] reveal">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full text-left py-5 font-disp font-semibold text-[1.15rem] text-green-700 flex justify-between items-center gap-4"
              aria-expanded={open}
            >
              <span>{f.q}</span>
              <span
                className={`text-gold text-2xl transition-transform duration-300 ${open ? "rotate-45" : ""}`}
              >
                +
              </span>
            </button>
            <div
              className="overflow-hidden transition-[max-height] duration-300 ease-out text-muted"
              style={{ maxHeight: open ? 400 : 0 }}
            >
              <p className="pb-5 pr-8">{f.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
