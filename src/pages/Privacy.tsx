import type { ReactNode } from "react";
import SEO from "@/components/SEO";
import { site } from "@/data/site-config";

// Plain-language privacy policy. The facts in here describe what this site and its checkout
// actually do (first-party page-view counts, Square for payments, Resend for email, Cloudflare for
// hosting/spam protection, the SwingRes booking system). When any of that changes (a new analytics
// or ad tool, a new vendor, a new kind of form), update this page and LAST_UPDATED.
const LAST_UPDATED = "October 17, 2026";

type Section = { heading: string; body: ReactNode };

function Ul({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-6 space-y-1.5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

const sections: Section[] = [
  {
    heading: "1. Information we collect",
    body: (
      <>
        <p className="font-semibold text-ink">Information you give us</p>
        <Ul
          items={[
            <>
              <strong>Contact and inquiry forms:</strong> your name, email, phone number, message, and any
              details you choose to include, such as an event date or group size.
            </>,
            <>
              <strong>League sign-ups:</strong> your name, contact details, handicap, and team preference.
            </>,
            <>
              <strong>Memberships and programs:</strong> your name, email, phone number, and payment card
              details, which you type into Square&rsquo;s secure payment form. For youth programs, a parent or
              guardian also gives us the child&rsquo;s first name and age.
            </>,
            <>
              <strong>Membership agreement:</strong> when you join Green Jacket Solo online, you review and
              sign our membership agreement electronically. We keep the agreement text you saw, your typed
              signature, the date and time you signed, your IP address, and basic device information as a
              record of your signature.
            </>,
            <>
              <strong>Bookings and member accounts:</strong> your name, email, phone number, booking details,
              and your acceptance of our liability waiver, collected through our booking and membership system.
            </>,
          ]}
        />
        <p className="font-semibold text-ink mt-5">Information collected automatically</p>
        <p>
          When you browse the Site we count visits so we know what&rsquo;s useful. That includes the pages you
          view, the website that sent you here, your approximate country, your browser and device type, and
          clicks on key buttons such as &ldquo;Book a bay.&rdquo; To tell one visit from another, the Site stores
          two random identifiers in your browser (one for the current visit, one for repeat visits). They
          aren&rsquo;t tied to your name. We also record your IP address when you submit a form or sign an
          agreement, to help prevent abuse and keep a record of the submission.
        </p>
        <p className="font-semibold text-ink mt-5">Payment information</p>
        <p>
          Card payments are handled by Square. Your card number goes straight to Square, and we never see or
          store it. We receive confirmation that a payment or subscription went through.
        </p>
      </>
    ),
  },
  {
    heading: "2. How we use your information",
    body: (
      <Ul
        items={[
          "To set up and run your membership, program, league spot, or booking, including recurring billing.",
          "To respond to your questions and requests.",
          "To send confirmations, receipts, account invitations, and other messages about your membership or booking.",
          "To keep records of signed agreements and waivers.",
          "To protect the Site and our business, including spam protection and fraud prevention.",
          "To understand how the Site is used and make it better.",
          "To send you news, offers, and updates about Swing Theory where the law allows. You can opt out at any time (see section 5).",
          "To comply with legal obligations and enforce our agreements.",
        ]}
      />
    ),
  },
  {
    heading: "3. Cookies and similar technologies",
    body: (
      <>
        <p>
          The Site uses your browser&rsquo;s session and local storage to keep the anonymous visit identifiers
          described above. This Site doesn&rsquo;t use advertising cookies or tracking pixels from third parties.
        </p>
        <p>
          Some of the services that make the Site work may set their own cookies or collect your IP address when
          they load, including Square&rsquo;s payment form, Cloudflare&rsquo;s security and spam protection,
          Google Maps on our Visit page, and Google Fonts. You can block or clear cookies and site data in your
          browser settings. The Site will still work, though our visit counts may be less accurate.
        </p>
      </>
    ),
  },
  {
    heading: "4. Who we share information with",
    body: (
      <>
        <p>We do not sell your personal information. We share it only with:</p>
        <Ul
          items={[
            <>
              <strong>Service providers</strong> that help us run the business and only handle information to
              do that work for us: Square (payments and subscriptions), Cloudflare (hosting, our database, and
              security), Resend (sending email), our booking and membership system (accounts, bookings, signed
              agreements and waivers, and sign-in), and Google (maps and fonts).
            </>,
            <>
              <strong>Authorities and others</strong> when the law requires it, such as in response to a
              subpoena or court order, or when needed to protect people or our rights.
            </>,
            <>
              <strong>A buyer or successor</strong> if Swing Theory is ever sold or reorganized, in which case
              the information would go with the business under the same protections.
            </>,
          ]}
        />
      </>
    ),
  },
  {
    heading: "5. Your choices",
    body: (
      <>
        <p>
          To stop marketing emails, use the unsubscribe link in any message or contact us. We&rsquo;ll still send
          messages that are necessary for your membership or booking, like receipts and account notices.
        </p>
        <p>
          The Site doesn&rsquo;t currently change how it works when it detects a Do Not Track signal, but because
          we don&rsquo;t sell personal information or share it for advertising, there is nothing for those signals
          to turn off.
        </p>
      </>
    ),
  },
  {
    heading: "6. California privacy rights",
    body: (
      <>
        <p>If you live in California, you may have the right to:</p>
        <Ul
          items={[
            "know what personal information we collect, use, and share about you, and get a copy of it;",
            "ask us to correct information that is wrong;",
            "ask us to delete the personal information we hold about you, with some exceptions;",
            "opt out of the sale or sharing of your personal information (we do neither); and",
            "be treated the same whether or not you use these rights.",
          ]}
        />
        <p>
          In the past 12 months we have collected the kinds of information described in section 1: identifiers like
          name, email, phone number, and IP address; records of memberships and purchases; website activity such as
          pages viewed; and electronic signatures. We have not sold this information or shared it for advertising.
        </p>
        <p>
          To use these rights, email or call us using the details below. We may need to confirm it&rsquo;s really you
          before we act on a request, and you can use an authorized agent to make a request for you.
        </p>
      </>
    ),
  },
  {
    heading: "7. How long we keep information",
    body: (
      <p>
        We keep information for as long as we need it to run your membership or booking, keep our business and tax
        records, resolve disputes, and meet legal requirements. Signed membership agreements and waivers are kept
        for the life of the membership and afterward as needed for those purposes. You can ask us to delete your
        information, and we will unless we are required or permitted to keep it.
      </p>
    ),
  },
  {
    heading: "8. Security",
    body: (
      <p>
        We use reasonable technical and organizational safeguards to protect your information, and card payments
        are handled by Square rather than on our own systems. No method of storing or sending information is
        completely secure, so we can&rsquo;t guarantee absolute security.
      </p>
    ),
  },
  {
    heading: "9. Children",
    body: (
      <p>
        The Site is meant for adults. Parents and guardians can enroll their children in our youth programs. When
        they do, we collect the child&rsquo;s first name and age from the parent or guardian only to run the program.
        We do not knowingly collect personal information directly from children under 13. If you believe a child has
        given us information, contact us and we will delete it.
      </p>
    ),
  },
  {
    heading: "10. Links to other sites",
    body: (
      <p>
        The Site links to other websites and services, like Instagram, Square, and our booking system. They have
        their own privacy practices, and this policy doesn&rsquo;t cover them.
      </p>
    ),
  },
  {
    heading: "11. Visitors outside the United States",
    body: (
      <p>
        We operate in the United States, and information you give us is processed and stored here. If you use the
        Site from another country, you understand your information will be transferred to the United States.
      </p>
    ),
  },
  {
    heading: "12. Changes to this policy",
    body: (
      <p>
        We may update this policy as our practices or the law change. When we do, we&rsquo;ll change the &ldquo;Last
        updated&rdquo; date at the top of this page.
      </p>
    ),
  },
  {
    heading: "13. Contact us",
    body: (
      <p>
        Questions, requests, or complaints about your privacy? Reach us at{" "}
        <a href={`mailto:${site.email}`} className="text-green-700 underline">
          {site.email}
        </a>{" "}
        or <a href={`tel:${site.phone.tel}`} className="text-green-700 underline">{site.phone.display}</a>, or write to{" "}
        {site.legalName}, {site.address.street}, {site.address.city}, {site.address.region} {site.address.postalCode}.
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy | Swing Theory"
        description="How Swing Theory Indoor Golf in Old Town Pasadena collects, uses, and shares your information, and the choices you have."
        path="/privacy"
      />

      <section className="bg-green-900 py-16">
        <div className="wrap">
          <span className="kicker text-gold">Legal</span>
          <h1 className="text-[clamp(2rem,4vw,3rem)] text-white mt-3">Privacy Policy</h1>
          <p className="text-[#b9bdb0] mt-2">Last updated {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="wrap max-w-3xl">
          <p className="text-muted leading-relaxed mb-10">
            This policy explains what information {site.name} (&ldquo;Swing Theory,&rdquo; &ldquo;we,&rdquo;
            &ldquo;us&rdquo;) collects when you visit {site.url.replace("https://", "")} (the &ldquo;Site&rdquo;), join a
            membership or program, or get in touch, how we use it, and the choices you have.
          </p>
          <div className="flex flex-col gap-10">
            {sections.map((s) => (
              <div key={s.heading}>
                <h2 className="font-disp text-xl text-green-700 mb-3">{s.heading}</h2>
                <div className="text-muted leading-relaxed space-y-3">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
