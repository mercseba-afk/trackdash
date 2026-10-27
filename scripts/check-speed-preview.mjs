import { spawn } from "node:child_process"
import { createRequire } from "node:module"
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "@playwright/test")
import assert from "node:assert/strict"
import { mkdir } from "node:fs/promises"
const require = createRequire(import.meta.url)
const server = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "3107"],
  {
    env: {
      ...process.env,
      VERCEL_ENV: "preview",
      TRACKDASH_CATALOG_ONLY_PREVIEW: "1",
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      DATABASE_URL: undefined,
      SUPABASE_SECRET_KEY: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
)
server.stdout.on("data", (chunk) => process.stdout.write(chunk))
server.stderr.on("data", (chunk) => process.stderr.write(chunk))
let browser
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Preview server startup timed out")), 60000)
    server.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("Ready")) {
        clearTimeout(timeout)
        resolve()
      }
    })
    server.on("exit", (code) => {
      clearTimeout(timeout)
      reject(new Error(`Preview server exited ${code}`))
    })
  })
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
    headless: true,
    args: ["--no-sandbox"],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.setDefaultTimeout(15000)
  const response = await page.goto("http://127.0.0.1:3107/speed-champions/catalog", {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  })
  assert.equal(response.status(), 200)
  await page.getByRole("heading", { name: /Le auto che ami/ }).waitFor({ timeout: 30000 })
  await page.locator('a[href^="/speed-champions/catalog/"]').first().waitFor()
  assert.equal(await page.locator('a[href^="/speed-champions/catalog/"]').count(), 19)
  await mkdir("docs/previews", { recursive: true })
  await page.screenshot({ path: "docs/previews/speed-champions-desktop.png", timeout: 20000 })
  await page.setViewportSize({ width: 390, height: 844 })
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "No mobile horizontal overflow",
  )
  await page.screenshot({ path: "docs/previews/speed-champions-mobile.png", timeout: 20000 })
  await page.goto("http://127.0.0.1:3107/speed-champions/catalog/76918", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  })
  await page.getByRole("heading", { name: "McLaren Solus GT & McLaren F1 LM", exact: true }).waitFor()
  await page.screenshot({ path: "docs/previews/speed-champions-detail-mobile.png", fullPage: true, timeout: 20000 })
  console.log("RENDER PASS: catalog, exact-set detail, mobile width; interaction tests are separate")
} finally {
  if (browser) await browser.close()
  server.kill("SIGTERM")
}
