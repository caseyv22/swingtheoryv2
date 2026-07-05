import SEO from "@/components/SEO";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import ContactForm from "@/components/forms/ContactForm";
import InstagramIcon from "@/components/InstagramIcon";
import { site } from "@/data/site-config";

export default function Contact() {
  return (
    <>
      <SEO
        title="Contact Swing Theory Indoor Golf, Pasadena"
        description="Contact Swing Theory Indoor Golf in Old Town Pasadena. Call, email, or use the contact form and we'll follow up shortly."
        path="/contact"
        image="https://swingtheory.golf/wp-content/uploads/2025/06/DSC07701-1024x683.jpg"
      />

      <Hero
        kicker="Contact"
        title={<>Say hello.</>}
        sub="Questions about bays, lessons, memberships, programs, or events. Send a note and a team member will follow up shortly."
        ctas={<span />}
        poster="https://swingtheory.golf/wp-content/uploads/2025/06/DSC07701-1024x683.jpg"
      />

      <section className="py-24">
        <div className="wrap grid gap-14 md:grid-cols-[1fr_1.1fr]">
          <div className="reveal">
            <SectionHead kicker="Reach us" title="Direct is faster." />
            <div className="space-y-4 text-[1.05rem]">
              <p>
                <b className="font-disp text-green-700">Phone</b>
                <br />
                <a href={`tel:${site.phone.tel}`} className="text-ink hover:text-green-700">
                  {site.phone.display}
                </a>
              </p>
              <p>
                <b className="font-disp text-green-700">Email</b>
                <br />
                <a href={`mailto:${site.email}`} className="text-ink hover:text-green-700">
                  {site.email}
                </a>
              </p>
              <p>
                <b className="font-disp text-green-700">Address</b>
                <br />
                {site.address.street}
                <br />
                {site.address.city}, {site.address.region} {site.address.postalCode}
              </p>
              <p>
                <b className="font-disp text-green-700">Hours</b>
                <br />
                {site.hours.display}
              </p>
              <p>
                <b className="font-disp text-green-700">Instagram</b>
                <br />
                <a
                  href={site.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-ink hover:text-green-700"
                >
                  <InstagramIcon /> {site.socials.instagramHandle}
                </a>
              </p>
            </div>
          </div>
          <div className="reveal">
            <SectionHead kicker="Contact form" title="Send a note." />
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
