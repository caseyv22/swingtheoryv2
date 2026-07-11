import type { Review } from "@/data/reviews";

// Renders as an external anchor so each card links to the source platform
// (Google, Yelp, ClassPass, Golf Now). Opens in a new tab so we don't drop
// the visitor off our page. rel=noopener is a security requirement for
// target=_blank; nofollow keeps outbound review-source links from bleeding
// PageRank into the platforms (they don't need it and we do).
export default function ReviewCard({ review }: { review: Review }) {
  return (
    <a
      href={review.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={`Read this ${review.source} review`}
      className="reveal block bg-cream border border-[var(--line)] rounded-2xl p-7 hover:border-gold/60 hover:shadow-[0_2px_20px_rgba(200,162,74,0.12)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
    >
      <div className="text-gold tracking-[2px] text-base">
        {"★".repeat(review.stars)}
      </div>
      <p className="my-3 text-[1.05rem] text-[#2b342e]">"{review.quote}"</p>
      <div className="font-disp font-semibold text-[13px] tracking-[0.05em] text-muted uppercase">
        {review.source} review
      </div>
    </a>
  );
}
