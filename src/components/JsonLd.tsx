import { Helmet } from "react-helmet-async";

// Render one or more JSON-LD blocks in <head>.
// Pass an array; each becomes its own <script> tag.
export default function JsonLd({ data }: { data: object | object[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <Helmet>
      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}
