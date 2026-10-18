import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

const SIGNATURE_FONT_HREF = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap";

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
 * The agreement drawer: a bottom sheet on phones, a side drawer on desktop. Same flow as the
 * waiver in SwingRes' booking site: the member reads to the end (the agree toggle stays disabled
 * until they do), types their name as their signature, then flips the toggle, which accepts and
 * closes the drawer. Mounted fresh on every open, so the opened/scrolled timestamps describe the
 * reading that led to the signature. Those two are only audit trail; the server sets the signing
 * time. Once signed, reopening it is read-only.
 */
function AgreementDrawer({
  agreement,
  firstName,
  lastName,
  signedName,
  onAccept,
  onClose,
}: {
  agreement: AgreementData;
  firstName: string;
  lastName: string;
  /** Set when the member already signed: the drawer then just shows what they signed. */
  signedName: string | null;
  onAccept: (a: { typedSignature: string; openedAt: string; scrollCompletedAt: string | null }) => void;
  onClose: () => void;
}) {
  const readOnly = signedName !== null;
  const [openedAt] = useState(() => new Date().toISOString());
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollCompletedAtRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [typed, setTyped] = useState(signedName ?? "");

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      scrollCompletedAtRef.current ??= new Date().toISOString();
      setScrolledToBottom(true);
    }
  }

  // A short agreement that fits without scrolling counts as read.
  useEffect(() => {
    handleScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreement.bodyText]);

  // Signature font, only loaded when the drawer is opened.
  useEffect(() => {
    if (document.querySelector(`link[href="${SIGNATURE_FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = SIGNATURE_FONT_HREF;
    document.head.appendChild(link);
  }, []);

  // Esc closes; the page behind doesn't scroll while the drawer is open. onClose goes through a
  // ref so a re-render of the parent doesn't re-run this (and steal focus from the name field).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const memberName = `${firstName} ${lastName}`.trim();
  const matches = signatureMatchesName(typed, firstName, lastName);
  const showMismatch = !readOnly && typed.trim().length > 0 && !matches;
  const canAccept = !readOnly && scrolledToBottom && matches;

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

  const signature = (
    <div className="mt-3 rounded-lg border border-line bg-white p-4">
      <div className="text-xs uppercase tracking-wide font-disp font-semibold text-muted">Member signature</div>
      <div
        className="mt-1 min-h-[2.75rem] text-[2rem] leading-tight text-green-700"
        style={{ fontFamily: "'Great Vibes', cursive" }}
        aria-label={typed ? `Signature: ${typed}` : "Signature will appear here"}
      >
        {typed || (
          <span className="text-muted/50 text-base" style={{ fontFamily: "inherit" }}>
            Type your name below to sign
          </span>
        )}
      </div>
      <div className="border-t border-ink/40 mt-1 pt-1 text-xs text-muted">
        {memberName || "Member"}, {studioDateLabel()}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agreement-drawer-title"
        className="relative flex flex-col w-full md:w-[36rem] h-[88vh] md:h-full bg-cream rounded-t-2xl md:rounded-none shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-line">
          <div>
            <h2 id="agreement-drawer-title" className="font-disp text-xl text-green-700">
              Membership Agreement
            </h2>
            <p className="text-sm text-muted">
              {readOnly ? "The agreement you signed" : "Please read it to the end, then sign"}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close agreement"
            className="rounded-full p-2 text-muted hover:text-ink hover:bg-black/5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col px-5 pt-4 pb-5 gap-3">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            tabIndex={0}
            role="region"
            aria-label="Membership agreement text"
            className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-line bg-white p-4 text-sm leading-relaxed text-muted flex flex-col gap-1"
          >
            {blocks.map((b, i) => renderBlock(b, i, signature))}
            {/* If staff removed {{SIGNATURE_BLOCK}} from the text, still show the signature under it. */}
            {!blocks.some((b) => b.kind === "signature") && signature}
          </div>

          {readOnly ? (
            <button
              type="button"
              onClick={onClose}
              className="flex-none rounded-lg bg-green-700 text-white font-disp font-semibold py-3"
            >
              Close
            </button>
          ) : (
            <>
              <p
                className={`flex-none text-center text-xs font-bold ${
                  scrolledToBottom ? "text-green-700" : "text-muted"
                }`}
              >
                {scrolledToBottom ? "✓ You've read to the end" : "↓ Scroll to the end to continue"}
              </p>

              <div className="flex-none flex flex-col gap-1.5">
                <label htmlFor="agreement-signature" className="font-disp font-semibold text-sm text-green-700">
                  Type your full name to sign <span className="text-gold">*</span>
                </label>
                <input
                  id="agreement-signature"
                  type="text"
                  autoComplete="off"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={memberName || "First Last"}
                  className="w-full rounded-lg border border-line bg-white px-4 py-3 text-ink"
                />
                {showMismatch && (
                  <p className="text-sm text-red-700">
                    Your signature must match the first and last name on the form ({memberName}).
                  </p>
                )}
              </div>

              <label
                className={`flex-none flex items-start gap-3 text-sm ${
                  canAccept ? "text-ink cursor-pointer" : "text-muted cursor-not-allowed"
                }`}
              >
                <input
                  type="checkbox"
                  checked={false}
                  disabled={!canAccept}
                  onChange={(e) => {
                    if (!e.target.checked || !canAccept) return;
                    onAccept({
                      typedSignature: typed.trim(),
                      openedAt,
                      scrollCompletedAt: scrollCompletedAtRef.current,
                    });
                  }}
                  className="mt-1 h-4 w-4 accent-green-700"
                />
                <span>
                  I have read and agree to the Swing Theory membership agreement, and I understand that typing my
                  name above is my legal signature.
                </span>
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The agreement row on the checkout form. Tapping the checkbox opens the drawer, and the box only
 * ends up checked once the member has signed inside it. Unchecking clears the signature.
 */
export default function AgreementPanel({ agreement, firstName, lastName, state, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const nameReady = firstName.trim().length > 0 && lastName.trim().length > 0;
  const signed = state.agreed && signatureMatchesName(state.typedSignature, firstName, lastName);

  // If they change their name after signing, the signature no longer matches it: sign again.
  useEffect(() => {
    if (stateRef.current.agreed && !signatureMatchesName(stateRef.current.typedSignature, firstName, lastName)) {
      onChange({ ...stateRef.current, agreed: false });
      setLocalError("You changed your name, so please sign the agreement again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName]);

  function openDrawer() {
    if (!nameReady) {
      setLocalError("Enter your first and last name above first, then open the agreement to sign it.");
      return;
    }
    setLocalError(null);
    setOpen(true);
  }

  function toggle() {
    if (signed) {
      onChange({ typedSignature: "", agreed: false, openedAt: null, scrollCompletedAt: null });
      return;
    }
    openDrawer();
  }

  const shownError = localError || error;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`flex items-start gap-3 rounded-lg border p-4 ${
          signed ? "border-green-700/40 bg-green-700/5" : "border-line bg-white"
        }`}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={signed}
          aria-label="Agree to the membership agreement"
          onClick={toggle}
          className={`mt-0.5 flex-none h-5 w-5 rounded border flex items-center justify-center ${
            signed ? "bg-green-700 border-green-700 text-white" : "bg-white border-ink/40"
          }`}
        >
          {signed && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
              <path d="m5 12 5 5 9-10" />
            </svg>
          )}
        </button>
        <div className="text-sm">
          <button type="button" onClick={toggle} className="text-left text-ink">
            I agree to the Swing Theory membership agreement <span className="text-gold">*</span>
          </button>
          <div className="mt-1 text-muted">
            {signed ? (
              <>
                Signed as <span className="font-semibold text-ink">{state.typedSignature}</span>.{" "}
                <button type="button" onClick={() => setOpen(true)} className="underline text-green-700">
                  View agreement
                </button>
              </>
            ) : (
              <button type="button" onClick={openDrawer} className="underline text-green-700">
                Read and sign the agreement
              </button>
            )}
          </div>
        </div>
      </div>

      {shownError && <p className="text-sm text-red-700">{shownError}</p>}

      {open && (
        <AgreementDrawer
          agreement={agreement}
          firstName={firstName}
          lastName={lastName}
          signedName={signed ? state.typedSignature : null}
          onClose={() => setOpen(false)}
          onAccept={({ typedSignature, openedAt, scrollCompletedAt }) => {
            onChange({ typedSignature, agreed: true, openedAt, scrollCompletedAt });
            setLocalError(null);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
