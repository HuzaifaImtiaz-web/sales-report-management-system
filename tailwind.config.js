/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#A91D22",      // Himmel Crimson Red
          primaryDark: "#8B1418",  // Darker Crimson
          secondary: "#FFC72C",    // Golden Yellow
          bg: "#FFFFFF",           // Clean White background as specified
          lightGray: "#F9FAFB",    // Soft grey
          navy: "#0B132B",         // Navy Accent
        },
        feedback: {
          success: "#10B981",      // Green
          warning: "#F59E0B",      // Amber
          error: "#EF4444",        // Red
        }
      },
      fontFamily: {
        sans: ["Poppins", "Inter", "sans-serif"], // Poppins prioritised
      },
      borderRadius: {
        'enterprise': '12px',      // Standard 12px rounded corners
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'premium': '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.02)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
