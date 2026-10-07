"use client"

import * as React from "react"

const REVEAL_SELECTOR = "[data-reveal]"

export function ScrollRevealController() {
  React.useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const seen = new WeakSet<Element>()
    let observer: IntersectionObserver | null = null

    const revealImmediately = (element: Element) => {
      element.classList.remove("td-reveal-pending")
      element.classList.add("td-reveal-visible")
    }

    const prepare = (element: Element) => {
      if (seen.has(element)) return
      seen.add(element)

      if (reduceMotion.matches) {
        revealImmediately(element)
        return
      }

      element.classList.add("td-reveal-pending")
      observer?.observe(element)
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          revealImmediately(entry.target)
          observer?.unobserve(entry.target)
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      },
    )

    const scan = (root: ParentNode = document) => {
      root.querySelectorAll(REVEAL_SELECTOR).forEach(prepare)
      if (root instanceof Element && root.matches(REVEAL_SELECTOR)) prepare(root)
    }

    scan()

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) scan(node)
        })
      }
    })

    mutationObserver.observe(document.body, { childList: true, subtree: true })

    const handleMotionPreference = () => {
      if (!reduceMotion.matches) return
      document.querySelectorAll(REVEAL_SELECTOR).forEach(revealImmediately)
      observer?.disconnect()
    }

    reduceMotion.addEventListener("change", handleMotionPreference)

    return () => {
      mutationObserver.disconnect()
      observer?.disconnect()
      reduceMotion.removeEventListener("change", handleMotionPreference)
    }
  }, [])

  return null
}
