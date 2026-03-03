export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0047ab",
        secondary: "#d62828",
        accent: "#f77f00",
        dark: "#0f1419",
        light: "#ffffff",
        success: "#10b981",
        warning: "#f77f00",
        danger: "#d62828"
      },
      fontFamily: {
        sans: ["'Poppins'", "sans-serif"],
        display: ["'Poppins'", "sans-serif"]
      },
      boxShadow: {
        "glow": "0 0 24px rgba(0, 71, 171, 0.4)",
        "glow-lg": "0 0 48px rgba(0, 71, 171, 0.5)",
        "card": "0 8px 28px rgba(0, 71, 171, 0.12)",
        "card-hover": "0 24px 72px rgba(0, 71, 171, 0.18)",
        "neon": "0 0 32px rgba(214, 40, 40, 0.5)"
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-60px)" },
          "100%": { opacity: "1", transform: "translateX(0)" }
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(60px)" },
          "100%": { opacity: "1", transform: "translateX(0)" }
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" }
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" }
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 24px rgba(0, 71, 171, 0.5)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 48px rgba(0, 71, 171, 0.8)" }
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" }
        },
        "glow-rotate": {
          "0%": { boxShadow: "0 0 24px rgba(0, 71, 171, 0.35)" },
          "50%": { boxShadow: "0 0 48px rgba(214, 40, 40, 0.5)" },
          "100%": { boxShadow: "0 0 24px rgba(0, 71, 171, 0.35)" }
        }
      },
      animation: {
        "fade-in-up": "fade-in-up 0.8s ease-out",
        "fade-in-down": "fade-in-down 0.8s ease-out",
        "slide-in-left": "slide-in-left 0.8s ease-out",
        "slide-in-right": "slide-in-right 0.8s ease-out",
        "float": "float 3s ease-in-out infinite",
        "bounce-slow": "bounce-slow 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shimmer": "shimmer 3s infinite",
        "glow-rotate": "glow-rotate 3s ease-in-out infinite"
      }
    }
  },
  plugins: []
}