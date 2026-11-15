import SEO from "@/components/SEO";
import SectionHead from "@/components/SectionHead";

// Support line printed on the in-bay "How to use the simulator" sign. It is not the studio's main
// number (site.phone), so it lives here instead of in site-config.
const techLine = { display: "(626) 240-2225", tel: "+16262402225" };

// A row of on-screen buttons to tap, in order. Read as a numbered list by screen readers.
function Steps({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 list-none p-0 m-0">
      {items.map((label, i) => (
        <li key={`${label}-${i}`} className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border-2 border-ink bg-paper px-4 py-2 font-disp font-bold text-ink text-[0.95rem] sm:text-base">
            {label}
          </span>
          {i < items.length - 1 && (
            <span aria-hidden="true" className="font-bold text-green-700 text-xl leading-none">
              ›
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

const shotSteps = [
  { title: "Place", body: "Place the ball in the dark green area." },
  { title: "Wait", body: "Wait for the screen to turn green, or for solid red dots overhead." },
  { title: "Swing", body: "Take your swing." },
];

export default function HowTo() {
  return (
    <>
      <SEO
        title="How to use the golf simulator | Swing Theory, Old Town Pasadena"
        description="Step-by-step guide to the golf simulators at Swing Theory in Old Town Pasadena: start the practice range, play a course, take your shot, and end your round."
        path="/how-to"
      />

      <section className="bg-green-900 text-white">
        <div className="wrap py-14 md:py-20">
          <span className="kicker !text-gold">How to</span>
          <h1 className="text-white font-extrabold mt-4 text-[clamp(2.6rem,8vw,5rem)] leading-[0.95]">
            Use the simulator
          </h1>
          <p className="max-w-[54ch] mt-6 text-[clamp(1.05rem,1.6vw,1.25rem)] text-[#e7e4d8] font-light">
            How to use the golf simulator at Swing Theory in Old Town Pasadena. Choose the practice
            range or a course on the screen, place the ball in the dark green area, wait for the
            screen to turn green, then swing. If anything goes wrong, call{" "}
            <a href={`tel:${techLine.tel}`} className="text-gold underline underline-offset-4">
              {techLine.display}
            </a>
            .
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="wrap space-y-14">
          <div>
            <SectionHead title="Practice range" className="!mb-6" />
            <Steps items={["Practice", "Practice range"]} />
          </div>

          <div>
            <SectionHead title="Play a course" className="!mb-6" />
            <Steps
              items={[
                "Play",
                "Select course",
                "Play",
                "Pick or create player",
                "Match",
                "Tee box",
                "Gimme: Auto Putt Fixed",
                "Play course",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 bg-paper">
        <div className="wrap">
          <SectionHead title="Take your shot" className="!mb-8" />
          <ol className="grid gap-5 md:grid-cols-3 list-none p-0 m-0">
            {shotSteps.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-line bg-cream p-6">
                <span className="font-disp font-extrabold text-gold-dk text-sm tracking-[0.12em]">
                  STEP {i + 1}
                </span>
                <h3 className="font-disp font-extrabold text-green-700 text-2xl mt-2 mb-2">
                  {step.title}
                </h3>
                <p className="text-ink m-0">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="wrap grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="font-disp font-extrabold text-green-700 text-2xl mb-2">Ball stuck?</h2>
            <p className="text-ink m-0">
              If a ball gets stuck under the screen, push the screen to get it.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="font-disp font-extrabold text-green-700 text-2xl mb-3">
              Done? End your round.
            </h2>
            <Steps items={["Top right", "Hamburger menu", "End round"]} />
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="wrap">
          <a
            href={`tel:${techLine.tel}`}
            className="block rounded-full bg-green-700 text-white text-center font-disp font-extrabold px-6 py-5 text-[clamp(1.1rem,3.2vw,1.9rem)] hover:bg-green-600 transition"
          >
            Call {techLine.display} for any technical issues
          </a>
        </div>
      </section>
    </>
  );
}
