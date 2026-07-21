import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import App from "./App";

// Build-time prerender entry. scripts/prerender.mjs compiles this with
// `vite build --ssr`, then calls render() once per public route and writes
// the result into dist/ as static HTML. This file is never shipped to the
// browser — the client entry stays src/main.tsx.
//
// No <React.StrictMode> here on purpose: StrictMode is a dev-time
// double-render tool and has no effect on renderToString output.
export function render(url: string) {
  const helmetContext: { helmet?: HelmetServerState } = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </HelmetProvider>,
  );
  return { html, helmet: helmetContext.helmet };
}
