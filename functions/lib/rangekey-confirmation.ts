import { escapeHtml } from "./http";
import { renderKv, wrapBrandedEmail } from "./email";

// Buyer's receipt for a RangeKey / RangeKey+ purchase. Same shell and tone as the other
// confirmations (wrapBrandedEmail + renderKv). `provisioned` false means SwingRes did not confirm
// the account yet: the email says we're finishing setup instead of promising an invite.
export function rangeKeyConfirmation(d: {
  firstName: string;
  optionName: string;
  hours: number;
  priceLabel: string;
  provisioned: boolean;
  inviteSent: boolean;
}): { subject: string; html: string } {
  const para = (html: string, mb = 14) =>
    `<p style="font-size:14px;color:#1a1a1a;line-height:1.6;margin:0 0 ${mb}px">${html}</p>`;
  const heading = (t: string) =>
    `<div style="font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#064029;margin:26px 0 10px">${escapeHtml(t)}</div>`;

  const next = d.provisioned
    ? d.inviteSent
      ? "You’ll get a separate email to set up your online account. Sign in there to see your hours balance and book your bays."
      : "Your account is set up. Sign in at res.swingtheory.golf with this email to see your hours balance and book your bays."
    : "We’re finishing setting up your account and will email you shortly. If you don’t hear from us within a few minutes, call 626-879-5513.";

  return {
    subject: `Your ${d.optionName} is ready, ${d.firstName}`,
    html: wrapBrandedEmail({
      title: `Your ${d.optionName} is ready.`,
      preheader: `${d.hours} hours of bay time, no expiration.`,
      bodyHtml:
        heading("Your purchase") +
        renderKv({
          item: d.optionName,
          hours: `${d.hours} hours of bay time`,
          paid: d.priceLabel,
        }) +
        heading("How it works") +
        para("Your hours never expire. Use as much as you want per day or per week until the balance hits zero.") +
        para(escapeHtml(next), 0),
    }),
  };
}
