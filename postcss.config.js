/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    cssnano: process.env.NODE_ENV === "production" ? {} :false,
  },
};

export default config;
