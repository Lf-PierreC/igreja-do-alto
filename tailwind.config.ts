import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        alto: {
          red: "#CB4B3B",
          redDark: "#A93829",
          redLight: "#F9EAE8",
          charcoal: "#252525",
          charcoalLight: "#363636",
          sand: "#DCDACF",
          sandLight: "#F4F3EE",
          sandDark: "#C7C4B5",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Gotham", "system-ui", "sans-serif"],
        display: ["var(--font-montserrat)", "Gotham Ultra", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
