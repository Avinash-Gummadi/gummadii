import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import { getSEO } from "@/lib/json-loader";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSEO();
  return {
    metadataBase: new URL('https://gummadii.com'),
    title: {
      default: seo.default.title,
      template: seo.default.titleTemplate,
    },
    description: seo.default.description,
    keywords: seo.default.keywords,
    icons: {
      icon: '/logo.png',
      apple: '/logo.png',
    },
    openGraph: {
      ...seo.default.openGraph,
      images: [
        {
          url: '/logo.png',
          alt: seo.default.title,
        },
      ],
    },
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
        <Chatbot />
      </body>
    </html>
  );
}
