import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Providers } from "@/providers";
import "@/styles/globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://algojams.cc"),
  title: "Algojams",
  description: "Live code music with strudel and collaborate with friends in real time.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Algojams",
    description: "Live code music with friends using strudel",
    url: "https://algojams.cc",
    siteName: "Algojams",
    images: [
      {
        url: "/site-banner.png",
        width: 1200,
        height: 630,
        alt: "Algojams - Live code music with friends",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Algojams",
    description: "Live code music with friends using strudel",
    images: ["/site-banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full overflow-hidden">
      <body className={`${geistMono.variable} font-mono antialiased h-full overflow-hidden`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
