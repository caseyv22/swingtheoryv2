import { useEffect, useRef, useState } from "react";

type SquareTokenizeResult = {
  status: string;
  token?: string;
  errors?: { message: string }[];
};

type SquareCardInstance = {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<SquareTokenizeResult>;
  destroy: () => Promise<void>;
};

type SquarePayments = {
  card: () => Promise<SquareCardInstance>;
};

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => SquarePayments;
    };
  }
}

const SDK_URL =
  import.meta.env.VITE_SQUARE_ENV === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

let sdkPromise: Promise<void> | null = null;

function loadSquareSdk(): Promise<void> {
  if (window.Square) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Couldn't load the payment form. Refresh and try again."));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

type Status = "loading" | "ready" | "error";

// Loads Square's Web Payments SDK, attaches a card element to `#containerId`,
// and exposes tokenize() for the checkout form to call on submit. The card
// number/CVV never touch our state or our server, Square hosts that field
// in its own iframe and hands back a one-time nonce we forward to our API.
export function useSquareCard(containerId: string) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<SquareCardInstance | null>(null);

  useEffect(() => {
    let cancelled = false;
    const appId = import.meta.env.VITE_SQUARE_APP_ID;
    const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

    if (!appId || !locationId) {
      setStatus("error");
      setError("Payment form isn't configured yet.");
      return;
    }

    loadSquareSdk()
      .then(async () => {
        if (cancelled || !window.Square) return;
        const payments = window.Square.payments(appId, locationId);
        const card = await payments.card();
        await card.attach(`#${containerId}`);
        if (cancelled) {
          await card.destroy();
          return;
        }
        cardRef.current = card;
        setStatus("ready");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Couldn't load the payment form.");
      });

    return () => {
      cancelled = true;
      cardRef.current?.destroy().catch(() => {});
      cardRef.current = null;
    };
  }, [containerId]);

  async function tokenize(): Promise<string> {
    if (!cardRef.current) throw new Error("Payment form isn't ready yet.");
    const result = await cardRef.current.tokenize();
    if (result.status !== "OK" || !result.token) {
      throw new Error(result.errors?.[0]?.message ?? "Card details couldn't be verified.");
    }
    return result.token;
  }

  return { status, error, tokenize };
}
