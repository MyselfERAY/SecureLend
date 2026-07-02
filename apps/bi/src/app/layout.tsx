import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureLend BI",
  description: "Sürükle-bırak BI editörü — Oracle, server-side pivot & paging",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="h-full">{children}</body>
    </html>
  );
}
