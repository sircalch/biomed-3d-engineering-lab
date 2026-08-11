import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://biomed-3d-engineering-lab.vercel.app";
const OG_IMAGE = "/biomed-equipment-atlas.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BioMed 3D Engineering Lab",
    template: "%s | BioMed 3D Engineering Lab",
  },
  description:
    "Laboratorio interactivo 3D para estudiar equipos medicos, subsistemas, senales, mantenimiento y documentacion biomedica.",
  applicationName: "BioMed 3D Engineering Lab",
  authors: [{ name: "Ing. Andres Monreal" }],
  creator: "Ing. Andres Monreal / Topic Tales Biomedica",
  keywords: [
    "equipos medicos 3D",
    "ingenieria biomedica",
    "tecnologia medica",
    "laboratorio virtual",
    "mantenimiento biomedico",
  ],
  openGraph: {
    title: "BioMed 3D Engineering Lab",
    description:
      "Explora equipos medicos en 3D y conecta teoria, diagnostico y evidencia tecnica.",
    url: SITE_URL,
    siteName: "BioMedTools MX Core",
    images: [
      {
        url: OG_IMAGE,
        width: 1600,
        height: 1000,
        alt: "Laboratorio 3D de equipos medicos para ingenieria biomedica",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BioMed 3D Engineering Lab",
    description:
      "Laboratorio interactivo 3D para estudiar equipos medicos, subsistemas y mantenimiento.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
