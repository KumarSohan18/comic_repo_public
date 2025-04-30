import { Poppins, Montserrat } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Edutainment Comics",
  description: "Generate educational comics with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head />
      <body
        className={`${montserrat.variable} ${poppins.className} font-sans antialiased min-h-full`}
      >
        {children}
      </body>
    </html>
  );
}
