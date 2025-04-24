/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        animation: {
          'gradient-x': 'gradient-x 15s ease infinite',
          'gradient-y': 'gradient-y 15s ease infinite',
          'gradient-xy': 'gradient-xy 15s ease infinite',
          'float': 'float 6s ease-in-out infinite',
          'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        keyframes: {
          'gradient-x': {
            '0%, 100%': {
              'background-size': '200% 200%',
              'background-position': 'left center'
            },
            '50%': {
              'background-size': '200% 200%',
              'background-position': 'right center'
            }
          },
          'gradient-y': {
            '0%, 100%': {
              'background-size': '200% 200%',
              'background-position': 'top center'
            },
            '50%': {
              'background-size': '200% 200%',
              'background-position': 'bottom center'
            }
          },
          'gradient-xy': {
            '0%, 100%': {
              'background-size': '400% 400%',
              'background-position': 'left top'
            },
            '25%': {
              'background-position': 'right top'
            },
            '50%': {
              'background-position': 'right bottom'
            },
            '75%': {
              'background-position': 'left bottom'
            }
          },
          'float': {
            '0%, 100%': {
              transform: 'translateY(0)'
            },
            '50%': {
              transform: 'translateY(-20px)'
            }
          }
        },
        backdropBlur: {
          xs: '2px',
        },
        transitionDuration: {
          '2000': '2000ms',
          '3000': '3000ms',
        },
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        },
      }
    },
    plugins: [],
  }