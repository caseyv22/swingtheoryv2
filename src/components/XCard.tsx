type Props = {
  tag: string;
  title: string;
  body: string;
  image: string;
  alt: string;
};

// "Experience" card, image bg with gradient, tag, title, body.
export default function XCard({ tag, title, body, image, alt }: Props) {
  return (
    <div className="reveal relative rounded-2xl overflow-hidden min-h-[360px] flex items-end text-white isolate group">
      <img
        src={image}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover -z-10 transition-transform duration-500 group-hover:scale-105"
      />
      <div
        className="absolute inset-0 -z-[1]"
        style={{
          background:
            "linear-gradient(180deg,rgba(4,29,19,0) 30%,rgba(4,29,19,.9) 100%)",
        }}
      />
      <div className="p-7">
        <span className="font-disp text-[11px] tracking-[0.2em] uppercase text-gold">
          {tag}
        </span>
        <h3 className="text-2xl font-bold mt-1">{title}</h3>
        <p className="text-[0.95rem] text-[#d9d6c8] mt-1 font-light">{body}</p>
      </div>
    </div>
  );
}
