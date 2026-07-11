import type { ReactNode } from "react";

type Props = {
  kicker: string;
  title: ReactNode;
  sub: string;
  ctas: ReactNode;
  trust?: ReactNode;
  videoSrc?: string;
  poster: string;
};

// Full-bleed dark hero with optional autoplay video.
// H1 should carry the money-phrase early (CLAUDE.md §3).
export default function Hero({
  kicker,
  title,
  sub,
  ctas,
  trust,
  videoSrc,
  poster,
}: Props) {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {videoSrc ? (
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          muted
          loop
          playsInline
          poster={poster}
          preload="metadata"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}
      {/* Darkened gradient overlay so gold + white text stay high-contrast
          against the underlying photo/video. Alpha bumped Jul 2026 after
          Casey flagged that the previous stops let too much image color
          through and muted the brand palette. Same green-900 base color,
          just heavier — going darker green rather than pure black keeps
          the brand tone intact. */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg,rgba(4,29,19,.72) 0%,rgba(4,29,19,.58) 40%,rgba(4,29,19,.95) 100%)",
        }}
      />
      <div className="wrap relative z-[2] text-white py-28 md:py-32">
        <span className="kicker !text-gold">{kicker}</span>
        <h1 className="text-white font-extrabold mt-4 max-w-[18ch] text-[clamp(2.6rem,6.4vw,5.4rem)]">
          {title}
        </h1>
        <p className="max-w-[54ch] mt-6 mb-8 text-[clamp(1.05rem,1.6vw,1.28rem)] text-[#e7e4d8] font-light">
          {sub}
        </p>
        <div className="flex gap-4 flex-wrap">{ctas}</div>
        {trust && (
          <div className="flex gap-6 flex-wrap mt-10 items-center">{trust}</div>
        )}
      </div>
    </section>
  );
}
