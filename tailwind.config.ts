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
        cream: "#f6f2e9",
        paper: "#ffffff",
        gold: {
          DEFAULT: "#c8a24a",
          dk: "#a07f2e",
        },
        ink: "#15201b",
        muted: "#5c6b63",
      },
      fontFamily: {
        disp: ['"Oxanium"', "system-ui", "sans-serif"],
        body: ['"Lato"', "system-ui", "sans-serif"],
      },
      maxWidth: {
        wrap: "1180px",
      },
      borderColor: {
        line: "rgba(6,64,41,.14)",
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
