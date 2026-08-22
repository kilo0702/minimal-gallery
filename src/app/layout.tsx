import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  let siteName = "Photo Journal";
  let siteIconUrl = "/favicon.ico";

  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ['siteName', 'siteIconUrl'] }
      }
    });

    const nameSetting = settings.find(s => s.key === 'siteName');
    const iconSetting = settings.find(s => s.key === 'siteIconUrl');

    if (nameSetting?.value) siteName = nameSetting.value;
    if (iconSetting?.value) siteIconUrl = iconSetting.value;
  } catch (error) {
    console.error("Failed to load metadata settings:", error);
  }

  return {
    title: siteName,
    description: "A personal photo journal app",
    icons: {
      icon: siteIconUrl,
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
