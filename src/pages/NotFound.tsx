import SEO from "@/components/SEO";
import Button from "@/components/Button";

export default function NotFound() {
  return (
    <>
      <SEO
        title="Page not found | Swing Theory"
        description="That page couldn't be found. Head back to the homepage or book a bay."
        path="/404"
        noIndex
      />
      <section className="py-32">
        <div className="wrap text-center">
          <span className="kicker">404</span>
          <h1 className="text-[clamp(2rem,4vw,3.5rem)] text-green-700 my-4">
            That page took a mulligan.
          </h1>
          <p className="text-muted max-w-lg mx-auto mb-8">
            The page you were looking for isn't here. Head back to the homepage
            or reserve a bay.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button to="/" variant="dk">
              Back to home
            </Button>
            <Button to="/book" variant="ghost-gold">
              Book a bay
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
