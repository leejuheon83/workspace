/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Pretendard"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Noto Sans KR"',
          "Arial",
          "sans-serif",
        ],
      },
      lineHeight: {
        reading: "1.6",
      },
      letterSpacing: {
        tight: "-0.01em",
      },
    },
  },
  plugins: [],
};
