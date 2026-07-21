import SEO from "@/components/SEO";
import Hero from "@/components/Hero";
import SectionHead from "@/components/SectionHead";
import MapCard from "@/components/MapCard";
import Button from "@/components/Button";
import InstagramIcon from "@/components/InstagramIcon";
import { site, directionsUrl } from "@/data/site-config";

export default function Visit() {
  return (
    <>
      <SEO
        title="Visit Swing Theory, 50 S De Lacey Ave, Old Town Pasadena"
        description="Swing Theory Indoor Golf is at 50 S De Lacey Ave #200 in the heart of Old Town Pasadena. Hours, parking, and directions."
        path="/visit"
        image={`${site.url}/images/visit/delacey-og.jpg`}
      />

      <Hero
        kicker="Visit"
        title={
          <>
            In the heart of <em className="not-italic text-gold">Old Town Pasadena.</em>
          </>
        }
        sub="Walkable from anywhere in Old Town, easy to reach from the San Gabriel Valley and downtown LA. Nearby garage parking on De Lacey and Fair Oaks."
        ctas={
          <>
            <Button href={directionsUrl} external variant="gold">
              Get directions
            </Button>
            <Button href={site.bookingUrl} external variant="ghost">
              Book a bay
            </Button>
          </>
        }
        poster="/images/visit/delacey.webp"
      />

      <section className="py-24">
        <div className="wrap grid gap-14 md:grid-cols-2 items-center">
          <div className="reveal">
            <SectionHead kicker="Location" title="Right on De Lacey." />
            <div className="space-y-4 text-[1.05rem]">
              <p>
                <b className="font-disp text-green-700">Address</b>
                <br />
                {site.address.street}
                <br />
                {site.address.city}, {site.address.region} {site.address.postalCode}
              </p>
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
                <b className="font-disp text-green-700">Hours</b>
                <br />
                {site.hours.displayLines[0]}
                <br />
                {site.hours.displayLines[1]}
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
          <MapCard />
        </div>
      </section>

      <section className="py-24 bg-paper">
        <div className="wrap">
          <SectionHead
            kicker="Serving"
            title="From Pasadena to the LA basin."
            intro={`Swing Theory serves golfers from ${site.areaServed.join(", ")}. The studio is in walking distance of most of Old Town Pasadena and a short drive from Glendale, Burbank, Alhambra, and Arcadia.`}
          />
        </div>
      </section>
    </>
  );
}
