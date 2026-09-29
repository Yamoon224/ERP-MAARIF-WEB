import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppearanceSync } from "@/components/theme/AppearanceSync";
import { ThemeSync } from "@/components/theme/ThemeSync";
import { ServiceWorkerRegistration } from "@/components/theme/ServiceWorkerRegistration";
import { APPEARANCE_SCRIPT } from "@/lib/appearance/palettes";
import { NO_FLASH_SCRIPT } from "@/lib/theme/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "ERP Maarif", template: "%s · ERP Maarif" },
  description: "Suivi scolaire des élèves : notes, présences, convocations, sanctions et scolarité.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ERP Maarif",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1224" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning : le script ci-dessous pose `data-theme` sur <html> avant l'hydratation.
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeSync />
        <AppearanceSync />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
