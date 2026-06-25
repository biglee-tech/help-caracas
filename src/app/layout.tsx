import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Biglee | Emergencia Venezuela",
  description:
    "Registro y consulta de ingresos hospitalarios por emergencia en Venezuela.",
  icons: {
    icon: "/biglee-logo.png",
    shortcut: "/biglee-logo.png",
    apple: "/biglee-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
