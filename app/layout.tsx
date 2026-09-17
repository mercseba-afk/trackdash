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

const pwaBootstrapScript = `
(function () {
  var existingDiagnostics = window.__trackdashPwaDiagnostics || {};
  var standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  window.__trackdashInstallPrompt = window.__trackdashInstallPrompt || null;
  window.__trackdashPwaDiagnostics = Object.assign(existingDiagnostics, {
    bootstrapAt: Date.now(),
    secureContext: window.isSecureContext,
    serviceWorkerSupported: "serviceWorker" in navigator,
    standaloneAtBootstrap: standalone,
    beforeInstallPromptSeen: Boolean(existingDiagnostics.beforeInstallPromptSeen),
    serviceWorkerControllerAtBootstrap: Boolean(navigator.serviceWorker && navigator.serviceWorker.controller)
  });

  if (standalone && window.location.pathname === "/") {
    window.location.replace("/dashboard");
    return;
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    window.__trackdashInstallPrompt = event;
    window.__trackdashPwaDiagnostics.beforeInstallPromptSeen = true;
    window.__trackdashPwaDiagnostics.beforeInstallPromptAt = Date.now();
    window.dispatchEvent(new Event("trackdash:pwa-available"));
    window.dispatchEvent(new Event("trackdash:pwa-state-change"));
  });

  window.addEventListener("appinstalled", function () {
    window.__trackdashInstallPrompt = null;
    window.__trackdashPwaDiagnostics.installedAt = Date.now();
    window.dispatchEvent(new Event("trackdash:pwa-installed"));
    window.dispatchEvent(new Event("trackdash:pwa-state-change"));
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      window.__trackdashPwaDiagnostics.serviceWorkerController = Boolean(navigator.serviceWorker.controller);
      window.__trackdashPwaDiagnostics.controllerChangedAt = Date.now();
      window.dispatchEvent(new Event("trackdash:pwa-state-change"));
    });

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(function (registration) {
        window.__trackdashPwaDiagnostics.serviceWorkerRegistered = true;
        window.__trackdashPwaDiagnostics.serviceWorkerScope = registration.scope;
        return navigator.serviceWorker.ready;
      })
      .then(function (registration) {
        window.__trackdashPwaDiagnostics.serviceWorkerReady = true;
        window.__trackdashPwaDiagnostics.serviceWorkerReadyScope = registration.scope;
        window.__trackdashPwaDiagnostics.serviceWorkerController = Boolean(navigator.serviceWorker.controller);
        window.__trackdashPwaDiagnostics.serviceWorkerReadyAt = Date.now();
        window.dispatchEvent(new Event("trackdash:pwa-state-change"));
      })
      .catch(function (error) {
        window.__trackdashPwaDiagnostics.serviceWorkerError = String(error);
        window.dispatchEvent(new Event("trackdash:pwa-state-change"));
      });
  }
})();
`

export const metadata: Metadata = {
  metadataBase: new URL("https://trackdash.it"),
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
      <head>
        <script id="trackdash-pwa-bootstrap" dangerouslySetInnerHTML={{ __html: pwaBootstrapScript }} />
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
