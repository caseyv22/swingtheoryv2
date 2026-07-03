import type { Review } from "@/data/reviews";

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="reveal bg-cream border border-[var(--line)] rounded-2xl p-7">
      <div className="text-gold tracking-[2px] text-base">
        {"★".repeat(review.stars)}
      </div>
      <p className="my-3 text-[1.05rem] text-[#2b342e]">"{review.quote}"</p>
      <div className="font-disp font-semibold text-[13px] tracking-[0.05em] text-muted uppercase">
        — {review.author} · {review.source}
      </div>
    </div>
  );
}
