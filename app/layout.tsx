import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { cookies } from "next/headers"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nBootstrap } from "@/components/i18n-bootstrap"
import { StoreProvider } from "@/lib/store"
import { I18nProvider, type AppLocale } from "@/lib/i18n"
import { MarketSignalsProvider } from "@/lib/market/context"
import { getPublicMarketSignalMap } from "@/lib/market/public"
import type { ReleaseMarketSignalMap } from "@/lib/market/view-types"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Mini 4WD Collector — Catalog, value & wishlist for your collection",
  description:
    "The collector's database for Tamiya Mini 4WD. Catalog your models, track market value with honest data, and manage your wishlist.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
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
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <StoreProvider>
            <MarketSignalsProvider initialSignals={initialMarketSignals}>
              <I18nProvider>
                <I18nBootstrap initialLocale={initialLocale} hasLocaleCookie={hasLocaleCookie}>
                  <TooltipProvider>{children}</TooltipProvider>
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
