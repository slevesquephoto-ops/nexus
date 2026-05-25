import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXUS",
  description: "Plateforme d'apprentissage gamifiée",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="antialiased nx-page-bg nx-grid-bg min-h-screen">{children}</body>
    </html>
  );
}
