import type { Metadata, Viewport } from "next";
import { Kanit, Teko } from "next/font/google";
import { PendingUploadProvider } from "@/components/PendingUploadProvider";
import "./globals.css";

// Fuente principal para Títulos y Botones (Cargamos grosores altos y cursivas)
const kanit = Kanit({ 
  subsets: ['latin'], 
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-kanit' 
});

// Fuente secundaria para Marcadores y Stats
const teko = Teko({ 
  subsets: ['latin'], 
  weight: ['400', '600'],
  variable: '--font-teko' 
});



export const metadata: Metadata = {
  title: "Inazuma Referee",
  description: "Interfaz de árbitro para partidos de Inazuma Eleven",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Inazuma Referee",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <PendingUploadProvider>{children}</PendingUploadProvider>
      </body>
    </html>
  );
}
