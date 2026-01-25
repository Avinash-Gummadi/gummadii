import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSEO } from "@/lib/json-loader";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSEO();
  return {
    metadataBase: new URL('http://localhost:3000'), // Should be configured via env in prod
    title: {
      default: seo.default.title,
      template: seo.default.titleTemplate,
    },
    description: seo.default.description,
    keywords: seo.default.keywords,
    openGraph: seo.default.openGraph,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${outfit.variable} antialiased min-h-screen flex flex-col font-sans`}
      >
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
