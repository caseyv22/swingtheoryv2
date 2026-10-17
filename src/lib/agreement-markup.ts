/**
 * The small markup the membership agreement is stored in (Settings > Membership Agreement), so
 * the signed PDF and the website's checkout can both lay it out like the original document
 * without a rich-text editor. One block per line:
 *
 *   = Text           centered bold title line
 *   # Text           bold section heading
 *   ---              horizontal rule
 *   - Text           bullet
 *     - Text         sub-bullet (two leading spaces)
 *   {{SIGNATURE_BLOCK}}   where the member's signature goes
 *   anything else    paragraph text; a blank line adds space
 *
 * and **double asterisks** make text bold within any line. Placeholders ({{MEMBER_NAME}} etc.)
 * are filled before parsing -- see fillAgreementPlaceholders. Pure functions, no I/O.
 */

export interface TextRun {
  text: string;
  bold: boolean;
}

export type AgreementBlock =
  | { kind: "title"; runs: TextRun[] }
  | { kind: "heading"; runs: TextRun[] }
  | { kind: "rule" }
  | { kind: "bullet"; level: 1 | 2; runs: TextRun[] }
  | { kind: "paragraph"; runs: TextRun[] }
  | { kind: "gap" }
  | { kind: "signature" };

export const SIGNATURE_BLOCK_PLACEHOLDER = "{{SIGNATURE_BLOCK}}";

/** Splits a line on `**` into alternating plain/bold runs, dropping empty ones. */
export function parseInline(line: string): TextRun[] {
  const runs: TextRun[] = [];
  line.split("**").forEach((text, index) => {
    if (text) runs.push({ text, bold: index % 2 === 1 });
  });
  return runs;
}

export function parseAgreementMarkup(body: string): AgreementBlock[] {
  const blocks: AgreementBlock[] = [];
  for (const raw of body.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) {
      if (blocks.length > 0 && blocks[blocks.length - 1]!.kind !== "gap") blocks.push({ kind: "gap" });
      continue;
    }
    if (line.trim() === SIGNATURE_BLOCK_PLACEHOLDER) blocks.push({ kind: "signature" });
    else if (/^-{3,}$/.test(line.trim())) blocks.push({ kind: "rule" });
    else if (line.startsWith("= ")) blocks.push({ kind: "title", runs: parseInline(line.slice(2)) });
    else if (line.startsWith("# ")) blocks.push({ kind: "heading", runs: parseInline(line.slice(2)) });
    else if (/^\s{2,}- /.test(line)) blocks.push({ kind: "bullet", level: 2, runs: parseInline(line.replace(/^\s+- /, "")) });
    else if (line.startsWith("- ")) blocks.push({ kind: "bullet", level: 1, runs: parseInline(line.slice(2)) });
    else blocks.push({ kind: "paragraph", runs: parseInline(line) });
  }
  while (blocks.length > 0 && blocks[blocks.length - 1]!.kind === "gap") blocks.pop();
  return blocks;
}

export interface AgreementVariables {
  memberName: string;
  /** Already formatted, e.g. "October 17, 2026". */
  effectiveDate: string;
  /** e.g. "$239". */
  monthlyFee: string;
  /** Optional sentence about a promotional first month; empty when there is none. */
  firstMonthTerms: string;
}

/** Values are typed by members or staff: keep them from opening/closing bold or adding lines. */
function clean(value: string): string {
  return value.replace(/\*/g, "").replace(/[\r\n]+/g, " ").trim();
}

/**
 * Fills the agreement's placeholders. {{SIGNATURE_BLOCK}} is left in place for the renderer.
 * {{FIRST_MONTH_TERMS}} is appended to a sentence, so a non-empty value gets a leading space.
 */
export function fillAgreementPlaceholders(body: string, vars: AgreementVariables): string {
  const firstMonth = clean(vars.firstMonthTerms);
  const values: Record<string, string> = {
    "{{MEMBER_NAME}}": clean(vars.memberName),
    "{{EFFECTIVE_DATE}}": clean(vars.effectiveDate),
    "{{MONTHLY_FEE}}": clean(vars.monthlyFee),
    "{{FIRST_MONTH_TERMS}}": firstMonth ? ` ${firstMonth}` : "",
  };
  let out = body;
  for (const [placeholder, value] of Object.entries(values)) out = out.split(placeholder).join(value);
  return out;
}
