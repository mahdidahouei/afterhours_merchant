import type { Config } from "tailwindcss";

/**
 * Colours and fonts are custom-property references, not literals — the values
 * live in `src/styles/tokens.css`.
 *
 * Each colour is read as `rgb(var(--x-rgb) / <alpha-value>)` rather than
 * `var(--x)`, because Tailwind can only compose an alpha into a colour it can
 * take apart. With a plain `var(--x)` the whole `/NN` family is silently
 * dropped: `border-color-primary/40` generates no rule, so the element falls
 * back to `currentColor` and the design quietly goes wrong with nothing to
 * catch it. The channel form makes those modifiers work, which is why the
 * `*Opacity` core plugins are on.
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
        "color-primary": "rgb(var(--color-primary-rgb) / <alpha-value>)",
        "color-primary-hover": "rgb(var(--color-primary-hover-rgb) / <alpha-value>)",
        "color-secondary": "rgb(var(--color-secondary-rgb) / <alpha-value>)",
        "color-secondary-hover": "rgb(var(--color-secondary-hover-rgb) / <alpha-value>)",
        "color-light": "rgb(var(--color-light-rgb) / <alpha-value>)",
        "color-dark": "rgb(var(--color-dark-rgb) / <alpha-value>)",

        "color-primary-text": "rgb(var(--color-primary-text-rgb) / <alpha-value>)",
        "color-secondary-text": "rgb(var(--color-secondary-text-rgb) / <alpha-value>)",
        "color-muted-text": "rgb(var(--color-muted-text-rgb) / <alpha-value>)",
        "color-disabled-text": "rgb(var(--color-disabled-text-rgb) / <alpha-value>)",

        "color-background": "rgb(var(--color-background-rgb) / <alpha-value>)",
        "color-background-2": "rgb(var(--color-background-2-rgb) / <alpha-value>)",
        "color-background-3": "rgb(var(--color-background-3-rgb) / <alpha-value>)",
        "color-neutral": "rgb(var(--color-neutral-rgb) / <alpha-value>)",
        "color-border": "rgb(var(--color-border-rgb) / <alpha-value>)",

        "color-danger": "rgb(var(--color-danger-rgb) / <alpha-value>)",
        "color-success": "rgb(var(--color-success-rgb) / <alpha-value>)",
        "color-warning": "rgb(var(--color-warning-rgb) / <alpha-value>)",
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
} satisfies Config;
