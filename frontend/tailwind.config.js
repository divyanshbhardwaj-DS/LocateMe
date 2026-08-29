/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        night: "#070B14",
        night2: "#0C1220",
        panel: "#0F1626",
        panel2: "#141D31",
        line: "rgba(148, 178, 216, 0.12)",
        line2: "rgba(148, 178, 216, 0.20)",
        mist: "rgba(148, 178, 216, 0.55)",
        fog: "#8BA0C0",
        cloud: "#C9D7EC",
        snow: "#EEF4FD",
        mint: "#3CE0A8",
        mint2: "#22D3EE",
        ember: "#FF8A5C",
        danger: "#FF6B6B",
        warning: "#FFC24B",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'DM Mono'", "'IBM Plex Mono'", "monospace"],
      },
      fontSize: {
        hero: ["clamp(2.6rem, 6vw, 4.5rem)", { lineHeight: "1.05" }],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "grid-glow":
          "linear-gradient(rgba(148,178,216,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,178,216,0.05) 1px, transparent 1px)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(60,224,168,0.25), 0 0 30px -6px rgba(60,224,168,0.45)",
        "glow-soft": "0 0 0 1px rgba(60,224,168,0.18), 0 20px 60px -20px rgba(60,224,168,0.35)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 60px -24px rgba(0,0,0,0.6)",
        cardlift: "0 1px 0 rgba(255,255,255,0.06) inset, 0 40px 90px -30px rgba(0,0,0,0.75)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.6)", opacity: "0.6" },
          "100%": { transform: "scale(2.1)", opacity: "0" },
        },
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        drift: {
          "0%,100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(18px, -14px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        aurora: {
          "0%,100%": { opacity: "0.5", transform: "translate(0,0) scale(1)" },
          "50%": { opacity: "0.9", transform: "translate(6%, -4%) scale(1.08)" },
        },
        sweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        ping2: {
          "0%": { transform: "scale(1)", opacity: "0.9" },
          "75%,100%": { transform: "scale(2.4)", opacity: "0" },
        },
      },
      animation: {
        pulseRing: "pulseRing 2.4s cubic-bezier(0.2,0.6,0.4,1) infinite",
        radar: "radar 4s linear infinite",
        float: "float 6s ease-in-out infinite",
        drift: "drift 9s ease-in-out infinite",
        shimmer: "shimmer 2.6s linear infinite",
        aurora: "aurora 14s ease-in-out infinite",
        sweep: "sweep 1.1s linear infinite",
        ping2: "ping2 1.8s cubic-bezier(0,0,0.2,1) infinite",
      },
    },
  },
  plugins: [],
}
