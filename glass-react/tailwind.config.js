/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: true,
  },
  prefix: 'glasstw-',
  content: [
    "./src2/**/*.tsx"
  ], // <-- tsx files use tailwind
  // prefix: '__glass-',
  theme: {
    extend: {},
  },
  plugins: [],
}

