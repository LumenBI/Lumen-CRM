import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#0066FF",
                navy: "#000D42",
                lightBlue: "#9FAEFF",
                "star-blue-glow": "#3b82f6",
                "star-purple-glow": "#8b5cf6",
            },
            fontFamily: {
                sans: ["Mulish", "sans-serif"],
            },
            animation: {
                blob: "blob 7s infinite",
                float: "float 6s ease-in-out infinite",
                "pulse-slow": "pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "gradient-xy": "gradient-xy 15s ease infinite",
                shimmer: "shimmer 2s linear infinite",
            },
            keyframes: {
                blob: {
                    "0%": {
                        transform: "translate(0px, 0px) scale(1)",
                    },
                    "33%": {
                        transform: "translate(30px, -50px) scale(1.1)",
                    },
                    "66%": {
                        transform: "translate(-20px, 20px) scale(0.9)",
                    },
                    "100%": {
                        transform: "translate(0px, 0px) scale(1)",
                    },
                },
                float: {
                    "0%, 100%": {
                        transform: "translateY(0)",
                    },
                    "50%": {
                        transform: "translateY(-20px)",
                    },
                },
                "pulse-slow": {
                    "0%, 100%": {
                        opacity: "1",
                    },
                    "50%": {
                        opacity: "0.5",
                    },
                },
                "gradient-xy": {
                    "0%, 100%": {
                        "background-size": "200% 200%",
                        "background-position": "left center",
                    },
                    "50%": {
                        "background-size": "200% 200%",
                        "background-position": "right center",
                    },
                },
                shimmer: {
                    from: {
                        "background-position": "0 0",
                    },
                    to: {
                        "background-position": "-200% 0",
                    },
                },
            },
        },
    },
    plugins: [],
};
export default config;
