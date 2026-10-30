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
          primary: "#A91D22",      // Himmel crimson: main buttons, active menu item, links
          primaryDark: "#8B1418",  // Crimson when hovered or pressed
          primaryBright: "#E0484D",// Crimson on dark backgrounds
          tint: "#FDF2F2",         // Very light pink: selected menu item or row
          secondary: "#FFC72C",    // Golden yellow: pending / warning
          bg: "#FFFFFF",           // Cards and tables
          lightGray: "#F8F9FA",    // Page background
          navy: "#0B132B",         // Dark mode page background
          navyCard: "#16203A",     // Dark mode cards
          navyLine: "#26314F",     // Dark mode borders
        },
        // Minimal neutrals (light mode)
        ink: "#111827",            // Main text
        muted: "#6B7280",          // Secondary text
        line: "#E5E7EB",           // Lines and borders
        feedback: {
          success: "#16A34A",      // Completed
          warning: "#FFC72C",      // Pending (golden yellow, dark text on it)
          error: "#DC2626",        // Cancelled / error
        }
      },
      fontFamily: {
        sans: ["Poppins", "Inter", "sans-serif"], // Poppins prioritised
      },
      borderRadius: {
        'enterprise': '12px',      // Standard 12px rounded corners
      },
      boxShadow: {
        // Flat design: cards are defined by their border; shadows stay barely visible.
        'soft': '0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        'premium': '0 8px 24px -6px rgba(16, 24, 40, 0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'drift': 'drift 18s ease-in-out infinite alternate', // sign-in page glow
        'loading-line': 'loadingLine 1.6s ease-in-out infinite', // loading page
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(24px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        drift: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(60px, 40px) scale(1.08)' },
          '100%': { transform: 'translate(-30px, 80px) scale(0.95)' },
        },
        loadingLine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(290%)' },
        }
      }
    },
  },
  plugins: [],
}
