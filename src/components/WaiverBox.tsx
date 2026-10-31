import { useEffect, useMemo, useRef, useState } from "react";
import { parseAgreementMarkup, type AgreementBlock, type TextRun } from "@/lib/agreement-markup";

export type WaiverData = { contentId: string; versionNumber: number; bodyText: string };
export type WaiverState = {
  agreed: boolean;
  openedAt: string | null;
  scrollCompletedAt: string | null;
};
export const EMPTY_WAIVER_STATE: WaiverState = { agreed: false, openedAt: null, scrollCompletedAt: null };

function Runs({ runs }: { runs: TextRun[] }) {
  return (
    <>
      {runs.map((r, i) =>
        r.bold ? (
          <strong key={i} className="font-semibold text-ink">
            {r.text}
          </strong>
        ) : (
          <span key={i}>{r.text}</span>
        ),
      )}
    </>
  );
}

function renderBlock(block: AgreementBlock, i: number) {
  switch (block.kind) {
    case "title":
      return (
        <h3 key={i} className="font-disp text-lg text-green-700 text-center font-bold">
          <Runs runs={block.runs} />
        </h3>
      );
    case "heading":
      return (
        <h4 key={i} className="font-disp font-bold text-green-700 mt-3">
          <Runs runs={block.runs} />
        </h4>
      );
    case "rule":
      return <hr key={i} className="border-line my-2" />;
    case "bullet":
      return (
        <p key={i} className={`${block.level === 2 ? "pl-10" : "pl-5"} -indent-3`}>
          <span aria-hidden="true">• </span>
          <Runs runs={block.runs} />
        </p>
      );
    case "gap":
      return <div key={i} className="h-2" aria-hidden="true" />;
    case "signature":
      return null; // waivers are accepted with a checkbox, no signature block
    default:
      return (
        <p key={i}>
          <Runs runs={block.runs} />
        </p>
      );
  }
}

/**
 * Liability waiver, same flow as the /book checkout: a scrollable box the buyer reads to the end,
 * and a checkbox that stays disabled until they have. The opened/scrolled timestamps are only an
 * audit trail; the server stamps the acceptance time.
 */
export default function WaiverBox({
  waiver,
  state,
  onChange,
  error,
}: {
  waiver: WaiverData;
  state: WaiverState;
  onChange: (next: WaiverState) => void;
  error?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(state.scrollCompletedAt !== null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const blocks = useMemo(() => parseAgreementMarkup(waiver.bodyText), [waiver.bodyText]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8 && !stateRef.current.scrollCompletedAt) {
      setScrolledToBottom(true);
      onChange({ ...stateRef.current, openedAt: stateRef.current.openedAt ?? new Date().toISOString(), scrollCompletedAt: new Date().toISOString() });
    }
  }

  // Record when it was first shown; a short waiver that fits without scrolling counts as read.
  useEffect(() => {
    if (!stateRef.current.openedAt) onChange({ ...stateRef.current, openedAt: new Date().toISOString() });
    handleScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiver.bodyText]);

  return (
    <div className="flex flex-col gap-2">
      <div className="font-disp font-semibold text-sm text-green-700">
        Liability waiver <span className="text-gold">*</span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        tabIndex={0}
        role="region"
        aria-label="Liability waiver text"
        className="h-56 overflow-y-auto rounded-lg border border-line bg-white p-4 text-sm leading-relaxed text-muted flex flex-col gap-1"
      >
        {blocks.map((b, i) => renderBlock(b, i))}
      </div>
      <p className={`text-center text-xs font-bold ${scrolledToBottom ? "text-green-700" : "text-muted"}`}>
        {scrolledToBottom ? "✓ You've read to the end" : "↓ Scroll to the end to continue"}
      </p>
      <label
        className={`flex items-start gap-3 text-sm ${
          scrolledToBottom ? "text-ink cursor-pointer" : "text-muted cursor-not-allowed"
        }`}
      >
        <input
          type="checkbox"
          checked={state.agreed}
          disabled={!scrolledToBottom}
          onChange={(e) => onChange({ ...state, agreed: e.target.checked })}
          className="mt-1 h-4 w-4 accent-green-700"
        />
        <span>I have read and agree to the Swing Theory liability waiver.</span>
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
