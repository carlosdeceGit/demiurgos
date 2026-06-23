import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

// Aplica el tema guardado antes del primer pintado para evitar parpadeo.
const themeScript = `try{var t=localStorage.getItem('dmg-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://demiurgos.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Demiurgos — Tu director creativo para redes",
    template: "%s · Demiurgos",
  },
  description:
    "Demiurgos aprende tu voz y tu criterio, lo cruza con cómo funciona cada red y con lo que pasa esta semana, y decide qué publicar, cuándo y por qué. Sin posts genéricos.",
  keywords: [
    "director creativo",
    "marca personal",
    "redes sociales",
    "estrategia de contenido",
    "IA creativa",
    "LinkedIn",
    "creadores",
  ],
  authors: [{ name: "Demiurgos" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    siteName: "Demiurgos",
    title: "Demiurgos — Tu director creativo para redes",
    description:
      "Aprende quién eres, cómo funciona cada red y qué pasa esta semana. Y decide qué publicar, cuándo y por qué.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Demiurgos — Tu director creativo para redes",
    description:
      "Aprende quién eres, cómo funciona cada red y qué pasa esta semana. Y decide qué publicar, cuándo y por qué.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
