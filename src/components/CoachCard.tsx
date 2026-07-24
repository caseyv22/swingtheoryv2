import { trackClick } from "@/lib/analytics";

type Coach = {
  slug: string;
  name: string;
  title: string;
  bio: string;
  photo: string;
  specialties: string[];
  phone?: string;
};

// Matches the reference layout Casey shared: title kicker, big name,
// short bio, an "Experience" checklist, then a phone CTA.
export default function CoachCard({ coach }: { coach: Coach }) {
  const telHref = coach.phone ? `tel:${coach.phone.replace(/[^\d+]/g, "")}` : undefined;

  return (
    <div className="reveal bg-paper border border-line rounded-2xl overflow-hidden flex flex-col">
      <img
        src={coach.photo}
        alt={coach.name}
        className="w-full aspect-[4/5] object-cover"
        loading="lazy"
      />
      <div className="p-6 flex flex-col flex-1">
        <div className="font-disp text-xs uppercase tracking-[0.14em] text-muted">
          {coach.title}
        </div>
        <h3 className="font-disp text-3xl uppercase tracking-wide text-green-700 mt-1">
          {coach.name}
        </h3>
        <p className="text-[0.98rem] text-ink mt-3">{coach.bio}</p>

        {coach.specialties.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 pb-2 border-b border-line">
              <span className="w-6 h-6 rounded-full bg-green-700 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-white">
                  <circle cx="10" cy="10" r="8" />
                </svg>
              </span>
              <span className="font-disp text-xs uppercase tracking-[0.14em] text-green-700">
                Experience
              </span>
            </div>
            <ul>
              {coach.specialties.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-2 py-2.5 border-b border-line last:border-0 text-[0.95rem] text-ink"
                >
                  <span className="text-green-700 mt-0.5">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {telHref && (
          <a
            href={telHref}
            onClick={() => trackClick(`coach_phone_${coach.slug}`, telHref)}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-green-700 text-white font-disp text-sm px-5 py-3 hover:bg-green-600 transition"
          >
            {coach.phone}
          </a>
        )}
      </div>
    </div>
  );
}
