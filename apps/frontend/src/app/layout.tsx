import type { Metadata, Viewport } from "next";
import { Russo_One, Montserrat } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const APP_NAME = "Inazuma Market";
const APP_DESCRIPTION = "Árbol de fichajes de Inazuma Eleven";

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
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fontRusso.variable} ${fontMontserrat.variable}`}>
      <body className="font-body bg-gray-50 text-gray-900 antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}