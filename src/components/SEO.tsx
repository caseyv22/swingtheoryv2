import { Helmet } from "react-helmet-async";
import { site } from "@/data/site-config";

type Props = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
};

// Every page renders one <SEO>. Title format: "<page> | Swing Theory"
// except homepage which uses the money-phrase title from index.html.
export default function SEO({ title, description, path, image, noIndex }: Props) {
  const url = `${site.url}${path}`;
  // Default OG image is a 1200x630 JPG. Apple Messages / iMessage does not
  // render WebP for link previews, and OG spec recommends JPG/PNG for
  // widest crawler compatibility. Per-page callers can still pass a
  // custom `image` prop.
  const ogImage = image ?? `${site.url}/images/home/home-sim-bays-og.jpg`;
  // The default OG image is a known 1200x630 JPG — declare its dimensions
  // so first-share previews render without the crawler fetching the image.
  const isDefaultImage = !image;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      {isDefaultImage && <meta property="og:image:width" content="1200" />}
      {isDefaultImage && <meta property="og:image:height" content="630" />}
      {isDefaultImage && <meta property="og:image:type" content="image/jpeg" />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={site.shortName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
