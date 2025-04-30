/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        
        // New direct color palette
        'soft-white': '#F9FAFB',
        'pastel-blue': '#7BDFF2',
        'soft-lavender': '#D5A9F6',
        'pastel-pink': '#FFA5C2',
        'charcoal': '#2A2E35',
        'light-gray': '#D1D5DB',
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
        },
        'gradient-y': {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'top center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'bottom center' },
        },
        'gradient-xy': {
          '0%, 100%': { 'background-size': '400% 400%', 'background-position': 'left top' },
          '25%': { 'background-position': 'right top' },
          '50%': { 'background-position': 'right bottom' },
          '75%': { 'background-position': 'left bottom' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      gradients: {
        'primary': 'linear-gradient(135deg, #7BDFF2 0%, #D5A9F6 100%)',
        'secondary': 'linear-gradient(135deg, #D5A9F6 0%, #FFA5C2 100%)',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #7BDFF2 0%, #D5A9F6 100%)',
        'secondary-gradient': 'linear-gradient(135deg, #D5A9F6 0%, #FFA5C2 100%)',
      },
    },
  },
  plugins: [],
}