/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "background": "#101415",
        "surface-tint": "#b4c5ff",
        "inverse-on-surface": "#2d3133",
        "surface-bright": "#363a3b",
        "on-background": "#e0e3e5",
        "surface-dim": "#101415",
        "primary-fixed": "#dbe1ff",
        "surface-container-low": "#191c1e",
        "secondary-fixed": "#6ffbbe",
        "surface-container-lowest": "#0b0f10",
        "primary-fixed-dim": "#b4c5ff",
        "tertiary-fixed": "#ffddb8",
        "on-error": "#690005",
        "tertiary-container": "#996100",
        "on-secondary-fixed": "#002113",
        "on-secondary": "#003824",
        "primary-container": "#2563eb",
        "on-secondary-fixed-variant": "#005236",
        "outline-variant": "#434655",
        "inverse-primary": "#0053db",
        "on-tertiary-container": "#ffeedd",
        "surface-container-high": "#272a2c",
        "error": "#ffb4ab",
        "secondary-container": "#00a572",
        "on-tertiary-fixed-variant": "#653e00",
        "on-primary-container": "#eeefff",
        "surface-container-highest": "#323537",
        "on-surface-variant": "#c3c6d7",
        "on-primary-fixed-variant": "#003ea8",
        "on-tertiary-fixed": "#2a1700",
        "on-error-container": "#ffdad6",
        "surface-variant": "#323537",
        "secondary": "#4edea3",
        "surface": "#101415",
        "on-tertiary": "#472a00",
        "inverse-surface": "#e0e3e5",
        "primary": "#b4c5ff",
        "on-secondary-container": "#00311f",
        "on-primary": "#002a78",
        "tertiary": "#ffb95f",
        "on-primary-fixed": "#00174b",
        "surface-container": "#1d2022",
        "tertiary-fixed-dim": "#ffb95f",
        "secondary-fixed-dim": "#4edea3",
        "error-container": "#93000a",
        "outline": "#8d90a0",
        "on-surface": "#e0e3e5"
      },
      "borderRadius": {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      "fontFamily": {
        "headline": ["'Plus Jakarta Sans'", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
