import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { cookies } from "next/headers"
import { Instrument_Sans, JetBrains_Mono } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nBootstrap } from "@/components/i18n-bootstrap"
import { PwaInstallManager } from "@/components/pwa-install-manager"
import { StoreProvider } from "@/lib/store"
import { I18nProvider, type AppLocale } from "@/lib/i18n"
import { MarketSignalsProvider } from "@/lib/market/context"
import { getPublicMarketSignalMap } from "@/lib/market/public"
import type { ReleaseMarketSignalMap } from "@/lib/market/view-types"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

const trackDashSans = Instrument_Sans({ subsets: ["latin"], variable: "--font-trackdash-sans" })
const trackDashMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-trackdash-mono" })

export const metadata: Metadata = {
  title: "TrackDash — Mini 4WD Collector, market value & wishlist",
  description:
    "TrackDash is the collector's database for Tamiya Mini 4WD. Catalog exact releases, track honest market value, manage your collection and wishlist, and scan models faster.",
  generator: "TrackDash",
  applicationName: "TrackDash",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/pwa/icon-v5-192.png", type: "image/png", sizes: "192x192" },
      { url: "/pwa/icon-v5.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/pwa/icon-v5.png", type: "image/png", sizes: "512x512" }],
  },
  appleWebApp: {
    capable: true,
    title: "TrackDash",
    statusBarStyle: "default",
  },
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f8fafc",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get("trackdash.locale")?.value
  const hasLocaleCookie = cookieLocale === "en" || cookieLocale === "it"
  const initialLocale: AppLocale = cookieLocale === "it" ? "it" : "en"
  let initialMarketSignals: ReleaseMarketSignalMap = {}

  try {
    initialMarketSignals = await getPublicMarketSignalMap()
  } catch (error) {
    console.error("Failed to bootstrap public R3 market signals:", error)
  }

  return (
    <html lang={initialLocale} suppressHydrationWarning className="bg-background">
      <body className={`${trackDashSans.variable} ${trackDashMono.variable} font-sans antialiased`}>
        <Script id="trackdash-pwa-install-capture" strategy="beforeInteractive">{`
          window.__trackdashInstallPrompt = null;
          window.addEventListener("beforeinstallprompt", function (event) {
            event.preventDefault();
            window.__trackdashInstallPrompt = event;
            window.dispatchEvent(new Event("trackdash:pwa-available"));
          });
        `}</Script>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
          <StoreProvider>
            <MarketSignalsProvider initialSignals={initialMarketSignals}>
              <I18nProvider>
                <I18nBootstrap initialLocale={initialLocale} hasLocaleCookie={hasLocaleCookie}>
                  <TooltipProvider>{children}</TooltipProvider>
                  <PwaInstallManager />
                  <Toaster position="top-center" />
                </I18nBootstrap>
              </I18nProvider>
            </MarketSignalsProvider>
          </StoreProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
