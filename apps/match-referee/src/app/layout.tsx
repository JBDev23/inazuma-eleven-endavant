import type { Metadata, Viewport } from "next";
import { Kanit, Teko } from "next/font/google";
import { PendingUploadProvider } from "@/components/PendingUploadProvider";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const APP_NAME = "Inazuma Referee";
const APP_DESCRIPTION = "Interfaz de árbitro para partidos de Inazuma Eleven";

// Fuente principal para Títulos y Botones (Cargamos grosores altos y cursivas)
const kanit = Kanit({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-kanit",
});

// Fuente secundaria para Marcadores y Stats
const teko = Teko({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-teko",
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
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${kanit.variable} ${teko.variable} h-full scrollbar-none`}
    >
      <body className="chalkboard-texture scanlines scrollbar-gutter-stable min-h-dvh antialiased">
        <PwaRegister />
        <PendingUploadProvider>{children}</PendingUploadProvider>
      </body>
    </html>
  );
}
