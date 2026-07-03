import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: {
          900: "#041d13",
          800: "#063a25",
          700: "#064029",
          600: "#0a5c39",
        },
        // Off-white page background (Brand Guideline Primary Color 01).
        cream: "#FAFBFF",
        paper: "#ffffff",
        gold: {
          DEFAULT: "#c8a24a",
          dk: "#a07f2e",
        },
        // Body text — brand guideline grayscale "Phantom".
        ink: "#1E1E24",
        // Secondary/muted text — brand guideline grayscale "Graphite".
        muted: "#6E7180",
        // Full brand guideline grayscale scale, available for new work.
        cloud: "#EDEFF7",
        smoke: "#D3D6E0",
        steel: "#BCBFCC",
        space: "#9DA2B3",
        graphite: "#6E7180",
        arsenic: "#40424D",
        phantom: "#1E1E24",
      },
      fontFamily: {
        disp: ['"Manrope"', "system-ui", "sans-serif"],
        body: ['"Manrope"', "system-ui", "sans-serif"],
      },
      maxWidth: {
        wrap: "1180px",
      },
      borderColor: {
        line: "#D3D6E0",
      },
      animation: {
        marquee: "marquee 26s linear infinite",
      },
      keyframes: {
        marquee: {
          to: { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
