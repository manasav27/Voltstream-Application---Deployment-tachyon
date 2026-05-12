/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VoltStream dark energy palette
        primary: '#38bdf8',
        accent: '#f97316',
        secondary: '#22c55e',
        solar: '#facc15',
        danger: '#ef4444',
        card: 'rgba(17, 24, 39, 0.72)', // The dark translucent card base
      },
      animation: {
        'pop-in-1': 'popIn 0.5s ease-out forwards',
        'pop-in-2': 'popIn 0.7s ease-out forwards',
        'pop-in-3': 'popIn 0.9s ease-out forwards',
      },
      keyframes: {
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
