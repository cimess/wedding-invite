import type { Metadata } from "next";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  preload: true,
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://toboreandebunoluwa.com"),
  title: "Tobore & Ebunoluwa — Wedding Celebration",
  description: "A celebration of love & togetherness. Saturday, 19 December 2026 · The NAFOWA Hall, Lagos, Nigeria.",
  openGraph: {
    title: "Tobore & Ebunoluwa — Wedding Celebration",
    description: "You are warmly invited to celebrate the wedding of Tobore & Ebunoluwa on Saturday, 19 December 2026.",
    url: "/",
    siteName: "Tobore & Ebunoluwa Wedding",
    images: [
      {
        url: "/images/wedding-pic/hero.webp",
        width: 1200,
        height: 630,
        alt: "Tobore & Ebunoluwa Wedding Celebration",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tobore & Ebunoluwa — Wedding Celebration",
    description: "You are warmly invited to celebrate the wedding of Tobore & Ebunoluwa on Saturday, 19 December 2026.",
    images: ["/images/wedding-pic/hero.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical hero WebP for instant above-the-fold paint */}
        <link
          rel="preload"
          as="image"
          href="/images/wedding-pic/hero.webp"
          type="image/webp"
        />
      </head>
      <body
        className={`${cormorant.variable} ${greatVibes.variable}`}
      >
        {children}
      </body>
    </html>
  );
}