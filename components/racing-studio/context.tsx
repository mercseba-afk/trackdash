"use client"

import { createContext, useContext } from "react"

const RacingStudioContext = createContext({ enabled: false, preview: false })
export const RacingStudioProvider = RacingStudioContext.Provider

export function useRacingStudio() {
  return useContext(RacingStudioContext)
}
