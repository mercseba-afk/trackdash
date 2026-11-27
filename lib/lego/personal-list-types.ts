export type LegoListKind = "collection" | "wishlist"

export const legoConditions = {
  sealed: "Sigillato",
  opened_complete: "Aperto completo",
  incomplete: "Incompleto",
} as const

export type LegoCondition = keyof typeof legoConditions

export type LegoListItem = {
  kind: LegoListKind
  setNumber: string
  quantity: number
  condition: LegoCondition | null
}
