import type { Metadata } from "next";
import { Outfit, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", weight: ["300","400","500","600","700"] });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], variable: "--font-serif", weight: "400", style: ["normal","italic"] });

export const metadata: Metadata = {
  title: "Folha | Feno e Pré-Secados",
  description: "O campo em sua forma mais nutritiva",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${outfit.variable} ${dmSerif.variable} font-sans h-full`}>{children}</body>
    </html>
  );
}
