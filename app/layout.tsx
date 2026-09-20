import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { cookies } from "next/headers"
import { Instrument_Sans, JetBrains_Mono } from "next/font/google"
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

const pwaPromptCaptureScript = `
(() => {
  if (window.__trackdashPwaPromptCaptureInstalled) return;
  window.__trackdashPwaPromptCaptureInstalled = true;

  const emit = (name) => window.dispatchEvent(new Event(name));

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    window.__trackdashInstallPrompt = event;
    emit("trackdash:pwa-available");
    emit("trackdash:pwa-state-change");
  });

  window.addEventListener("appinstalled", () => {
    window.__trackdashInstallPrompt = null;
    emit("trackdash:pwa-installed");
    emit("trackdash:pwa-state-change");
  });
})();
`

export const metadata: Metadata = {
  metadataBase: new URL("https://trackdash.it"),
  title: "TrackDash — Tamiya Mini 4WD Collection, Market Value & Trading",
  description:
    "Identify exact Tamiya Mini 4WD Releases, discover market value, build your collection, watch the market and buy or sell with other collectors on TrackDash.",
  generator: "TrackDash",
  applicationName: "TrackDash",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/pwa/icon-v6-192.png", type: "image/png", sizes: "192x192" },
      { url: "/pwa/icon-v6.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/pwa/icon-v6.png", type: "image/png", sizes: "512x512" }],
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
      <head>
        <script id="trackdash-pwa-prompt-capture" dangerouslySetInnerHTML={{ __html: pwaPromptCaptureScript }} />
      </head>
      <body className={`${trackDashSans.variable} ${trackDashMono.variable} font-sans antialiased`}>
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