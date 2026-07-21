import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./styles/index.css";

const container = document.getElementById("root")!;
const app = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);

// Prerendered pages (scripts/prerender.mjs) ship real HTML inside #root
// plus a marker meta naming the route they were rendered for. Hydrate only
// when that marker matches the URL actually being viewed. Everything else
// — non-prerendered routes served the root homepage HTML by Cloudflare's
// default SPA fallback (see public/_redirects), or a prerendered file
// somehow served for the wrong path — gets a plain client render instead
// of a mismatched hydration.
const marker = document
  .querySelector('meta[name="prerender-path"]')
  ?.getAttribute("content");
const path = window.location.pathname.replace(/\/+$/, "") || "/";

if (container.hasChildNodes() && marker === path) {
  hydrateRoot(container, app);
} else {
  if (container.hasChildNodes()) container.innerHTML = "";
  createRoot(container).render(app);
}
