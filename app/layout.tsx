import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./registration.css";
import "./review.css";
import "./accessibility.css";
import "./permanent-registry.css";
import "./photo-preview.css";
import "./checkin-camera.css";
import "./unified-camera.css";
import "./face-mismatch.css";
import "./annual-history.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Festa do Peixe | Gestão do almoço comunitário",
  description: "Cadastro, validação municipal e check-in acolhedor para a Festa do Peixe de Flórida.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Festa do Peixe",
    description: "Cadastro e acesso à Festa do Peixe.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Festa do Peixe" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Festa do Peixe",
    description: "Cadastro e acesso à Festa do Peixe.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
