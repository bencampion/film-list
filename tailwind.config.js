import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.liquid"],
  theme: {
    colors: {
      grey: colors.neutral,
    },
    screens: {
      sm: "640px",
      md: "960px",
      lg: "1280px",
      xl: "1600px",
      "2xl": "1920px",
    },
    extend: {},
  },
  plugins: [],
};

export default config;
