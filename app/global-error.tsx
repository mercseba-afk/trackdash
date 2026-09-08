"use client"

import * as React from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    const payload = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      pathname: window.location.pathname,
      href: window.location.href,
      userAgent: navigator.userAgent,
      occurredAt: new Date().toISOString(),
    }

    void fetch("/api/client-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {})
  }, [error])

  return (
    <html>
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "#0a0a0a",
            color: "#f5f5f5",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ maxWidth: "420px", textAlign: "center" }}>
            <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>This page couldn’t load</h1>
            <p style={{ color: "#a3a3a3", marginBottom: "20px" }}>
              TrackDash recorded the client error so it can be diagnosed. Try reloading the page once.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{ padding: "10px 16px", borderRadius: "8px", border: 0, cursor: "pointer" }}
              >
                Reload
              </button>
              <button
                type="button"
                onClick={reset}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #404040",
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
