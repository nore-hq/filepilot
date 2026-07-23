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
        tarantino: '#FF4F00', // Updated to match your CSS root
        noir: '#1A1A1A',
        burnt: '#C2410C',
      },
      fontFamily: {
        // 1. Create a custom font family mapping to your variable
        heading: ['var(--font-syne)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;