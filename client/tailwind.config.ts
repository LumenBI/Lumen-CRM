import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./constants/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Mulish", "sans-serif"], // Identidad Star Cargo
            },
            colors: {
                // Paleta Oficial Star Cargo
                base: {
                    900: '#000D42', // Navy profundo (Footer/Fondos oscuros)
                    800: '#0A1D58',
                    100: '#D4D9EC', // Texto claro en fondo oscuro
                },
                blue: {
                    600: '#004DF0', // Azul vibrante
                    500: '#0056FC', // Azul primario (Botones)
                    400: '#4A71FF',
                    50: '#E9EBFF',  // Fondos muy claros
                },
                // Neutros estilo Kaizen para limpieza visual
                surface: {
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                }
            },
            boxShadow: {
                // Sombras difusas estilo Kaizen ("elevación" sin bordes duros)
                'soft': '0 20px 40px -15px rgba(0, 13, 66, 0.1)',
                'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
                'glow': '0 0 20px rgba(0, 86, 252, 0.15)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            }
        },
    },
    plugins: [],
};
export default config;
