// Shared by the checkout page (to enable the sign button) and the checkout function (to enforce
// it): the typed signature has to be the member's own first and last name as entered on the form.

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function signatureMatchesName(typed: string, firstName: string, lastName: string): boolean {
  const t = normalize(typed);
  if (!t) return false;
  return t === normalize(`${firstName} ${lastName}`);
}

/** Today's date in the studio's timezone, e.g. "October 17, 2026" (the agreement's effective date). */
export function studioDateLabel(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
