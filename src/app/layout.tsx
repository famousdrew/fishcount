import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Columbia River FishCount - Bonneville Dam",
  description: "Real-time fish counts, weather, tides, and fishing conditions for the Columbia River near Portland, OR",
  keywords: ["fishing", "Columbia River", "Bonneville Dam", "fish count", "salmon", "steelhead", "Portland", "Oregon"],
  openGraph: {
    title: "Columbia River FishCount",
    description: "Check fishing conditions before you go",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
