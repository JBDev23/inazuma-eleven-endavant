import type { Metadata } from "next";
import { Russo_One, Montserrat } from "next/font/google";
import "./globals.css";

// Cargamos la fuente de los títulos
const fontRusso = Russo_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-russo",
});

const fontMontserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Inazuma Market",
  description: "Árbol de fichajes de Inazuma Eleven",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fontRusso.variable} ${fontMontserrat.variable}`}>
      <body className="font-body bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}