import type { Metadata } from "next";
import "./globals.css";
import { FormValidationSync } from "@/components/FormValidationSync";

export const metadata: Metadata = {
  title: "Igreja do Alto | Cuidado & Visitação Pastoral",
  description:
    "Sistema de Visitas Pastorais da Igreja do Alto — Lugar de Proteção, Provisão e Direção.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      {
        url: "/favicon.png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#DCDACF] text-[#252525]">
        <FormValidationSync />
        {children}
      </body>
    </html>
  );
}
