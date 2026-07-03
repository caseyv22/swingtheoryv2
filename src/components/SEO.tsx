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
  const ogImage =
    image ??
    "https://swingtheory.golf/wp-content/uploads/2024/12/HOME-GOLF-SIM.jpg";
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
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
