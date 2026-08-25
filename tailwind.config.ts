import type { Config } from "tailwindcss";

/**
 * Colours and fonts are `var(--…)` references, not literals — the values live in
 * `src/styles/tokens.css`. Opacity modifiers (`bg-color-primary/50`) do not work
 * with plain custom properties, which is why the `*Opacity` core plugins are off;
 * use an explicit `rgb(… / …)` in an arbitrary value when you need translucency.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      xs: "375px", // small phones
      sm: "480px", // large phones
      md: "640px", // phablets / small tablets
      tb: "768px", // tablets
      lg: "1024px", // small laptops
      "2lg": "1200px", // laptops
      xl: "1360px",
      "2xl": "1440px",
      "3xl": "1600px", // desktops
      "4xl": "1920px",
    },
    extend: {
      colors: {
        "color-primary": "var(--color-primary)",
        "color-primary-hover": "var(--color-primary-hover)",
        "color-secondary": "var(--color-secondary)",
        "color-secondary-hover": "var(--color-secondary-hover)",
        "color-light": "var(--color-light)",
        "color-dark": "var(--color-dark)",

        "color-primary-text": "var(--color-primary-text)",
        "color-secondary-text": "var(--color-secondary-text)",
        "color-muted-text": "var(--color-muted-text)",
        "color-disabled-text": "var(--color-disabled-text)",

        "color-background": "var(--color-background)",
        "color-background-2": "var(--color-background-2)",
        "color-background-3": "var(--color-background-3)",
        "color-neutral": "var(--color-neutral)",
        "color-border": "var(--color-border)",

        "color-danger": "var(--color-danger)",
        "color-success": "var(--color-success)",
      },
      fontFamily: {
        satoshi: "var(--font-satoshi)",
        lora: "var(--font-lora)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  corePlugins: {
    // See the note above — custom-property colours can't take an alpha channel.
    backdropOpacity: false,
    backgroundOpacity: false,
    borderOpacity: false,
    divideOpacity: false,
    ringOpacity: false,
    textOpacity: false,
  },
} satisfies Config;
