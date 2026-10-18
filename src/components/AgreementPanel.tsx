import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  fillAgreementPlaceholders,
  parseAgreementMarkup,
  type AgreementBlock,
  type TextRun,
} from "@/lib/agreement-markup";
import { signatureMatchesName, studioDateLabel } from "@/lib/agreement-signature";

export interface AgreementData {
  contentId: string;
  versionNumber: number;
  bodyText: string;
  monthlyFee: string;
  firstMonthTerms: string;
}

export interface AgreementState {
  typedSignature: string;
  agreed: boolean;
  openedAt: string | null;
  scrollCompletedAt: string | null;
}

interface Props {
  agreement: AgreementData;
  firstName: string;
  lastName: string;
  state: AgreementState;
  onChange: (next: AgreementState) => void;
  error?: string;
}

const SIGNATURE_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap";

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

function renderBlock(block: AgreementBlock, i: number, signature: ReactNode): ReactNode {
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
      return <div key={i}>{signature}</div>;
    default:
      return (
        <p key={i}>
          <Runs runs={block.runs} />
        </p>
      );
  }
}

/**
 * The membership agreement, shown inside the checkout form. The member reads it in a scrollable
 * box, types their name (shown back in cursive as the signature), and ticks "I agree". The
 * opened/scrolled timestamps are only part of the audit trail; the server sets the signing time.
 */
export default function AgreementPanel({ agreement, firstName, lastName, state, onChange, error }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Signature font, loaded only when the agreement is on screen.
  useEffect(() => {
    if (document.querySelector(`link[href="${SIGNATURE_FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = SIGNATURE_FONT_HREF;
    document.head.appendChild(link);
  }, []);

  // "Opened" = the agreement was rendered for the member.
  useEffect(() => {
    if (stateRef.current.openedAt) return;
    onChange({ ...stateRef.current, openedAt: new Date().toISOString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function markScrolled() {
    const el = scrollRef.current;
    if (!el || stateRef.current.scrollCompletedAt) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      onChange({ ...stateRef.current, scrollCompletedAt: new Date().toISOString() });
    }
  }

  // Short agreements that don't need scrolling count as fully read.
  useEffect(() => {
    markScrolled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreement.bodyText]);

  const memberName = `${firstName} ${lastName}`.trim();
  const blocks = useMemo(
    () =>
      parseAgreementMarkup(
        fillAgreementPlaceholders(agreement.bodyText, {
          memberName: memberName || "the member",
          effectiveDate: studioDateLabel(),
          monthlyFee: agreement.monthlyFee,
          firstMonthTerms: agreement.firstMonthTerms,
        }),
      ),
    [agreement.bodyText, agreement.monthlyFee, agreement.firstMonthTerms, memberName],
  );

  const typed = state.typedSignature;
  const matches = signatureMatchesName(typed, firstName, lastName);
  const showMismatch = typed.trim().length > 0 && !matches;

  const signature = (
    <div className="mt-3 rounded-lg border border-line bg-white p-4">
      <div className="text-xs uppercase tracking-wide font-disp font-semibold text-muted">Member signature</div>
      <div
        className="mt-1 min-h-[2.75rem] text-[2rem] leading-tight text-green-700"
        style={{ fontFamily: "'Great Vibes', cursive" }}
        aria-label={typed ? `Signature: ${typed}` : "Signature will appear here"}
      >
        {typed || <span className="text-muted/50 text-base" style={{ fontFamily: "inherit" }}>Type your name below to sign</span>}
      </div>
      <div className="border-t border-ink/40 mt-1 pt-1 text-xs text-muted">
        {memberName || "Member"}, {studioDateLabel()}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <label className="font-disp font-semibold text-sm text-green-700" htmlFor="agreement-scroll">
          Membership agreement <span className="text-gold">*</span>
        </label>
        <span className="text-xs text-muted">Please read to the end</span>
      </div>

      <div
        id="agreement-scroll"
        ref={scrollRef}
        onScroll={markScrolled}
        tabIndex={0}
        role="region"
        aria-label="Membership agreement text"
        className="max-h-80 overflow-y-auto rounded-lg border border-line bg-white p-4 text-sm leading-relaxed text-muted flex flex-col gap-1"
      >
        {blocks.map((b, i) => renderBlock(b, i, signature))}
        {/* If staff removed {{SIGNATURE_BLOCK}} from the text, still show the signature under it. */}
        {!blocks.some((b) => b.kind === "signature") && signature}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="agreement-signature" className="font-disp font-semibold text-sm text-green-700">
          Type your full name to sign <span className="text-gold">*</span>
        </label>
        <input
          id="agreement-signature"
          type="text"
          autoComplete="off"
          value={typed}
          onChange={(e) => onChange({ ...state, typedSignature: e.target.value })}
          placeholder={memberName || "First Last"}
          className="w-full rounded-lg border border-line bg-white px-4 py-3 text-ink"
        />
        {showMismatch && (
          <p className="text-sm text-red-700">
            Your signature must match the first and last name above ({memberName || "enter your name"}).
          </p>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm text-ink cursor-pointer">
        <input
          type="checkbox"
          checked={state.agreed}
          onChange={(e) => onChange({ ...state, agreed: e.target.checked })}
          className="mt-1 h-4 w-4 accent-green-700"
        />
        <span>
          I have read and agree to the Swing Theory membership agreement, and I understand that typing my name
          above is my legal signature.
        </span>
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
