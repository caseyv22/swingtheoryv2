/**
 * Swing Theory lockup logo — swoosh mark + "SWING / THEORY" wordmark.
 * Recreated in code per the brand guideline (Manrope, lockup with the
 * wordmark to the right of the mark). Renders in `currentColor`, so wrap
 * with a text color class to control it on light or dark backgrounds.
 */
type Props = {
  className?: string;
  markClassName?: string;
  /** Hide the wordmark and render just the swoosh mark (e.g. favicon-style use). */
  markOnly?: boolean;
};

export default function Logo({ className, markClassName, markOnly = false }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <svg
        viewBox="0 0 120 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={markClassName ?? "h-[26px] w-[34px]"}
        aria-hidden="true"
      >
        <path
          d="M4 34C22 10 52 2 78 10C92 14.5 104 22 116 34C100 30 84 30 70 36C58 41 50 50 40 50C28 50 18 43 4 34Z"
          fill="currentColor"
          opacity=".55"
        />
        <path
          d="M116 56C98 80 68 88 42 80C28 75.5 16 68 4 56C20 60 36 60 50 54C62 49 70 40 80 40C92 40 102 47 116 56Z"
          fill="currentColor"
        />
      </svg>
      {!markOnly && (
        <span className="flex flex-col leading-[0.95]">
          <b className="font-disp font-extrabold text-[17px] tracking-[0.01em]">SWING</b>
          <span className="font-disp font-normal text-[11px] tracking-[0.32em] opacity-80">
            THEORY
          </span>
        </span>
      )}
    </span>
  );
}
