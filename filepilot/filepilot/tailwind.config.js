const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}", 
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",        
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#F1EFE7',
        tarantino: '#FF4F00',
        noir: '#1A1A1A',
        burnt: '#C2410C',
      },
      fontFamily: {
        heading: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;