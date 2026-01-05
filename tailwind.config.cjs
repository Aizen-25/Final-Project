module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6f5ff',
          100: '#efedff',
          200: '#e6e3ff',
          400: '#9f8df7',
          500: '#6B5CE1',
          600: '#5643c9',
        },
        muted: '#7b7d8d',
        accent: '#ffd6e0',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        card: '0 6px 20px rgba(100, 80, 200, 0.08)',
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
}
