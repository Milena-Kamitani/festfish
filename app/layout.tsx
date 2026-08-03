import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Festa do Peixe | Gestão do almoço comunitário",
  description: "Cadastro, validação municipal e check-in acolhedor para a Festa do Peixe de Flórida.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Festa do Peixe 2026",
    description: "Almoço comunitário com controle e acolhimento.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Festa do Peixe 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Festa do Peixe 2026",
    description: "Almoço comunitário com controle e acolhimento.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
