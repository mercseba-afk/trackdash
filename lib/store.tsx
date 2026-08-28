"use client"

import * as React from "react"
import type {
  CollectionItem,
  Condition,
  Currency,
  User,
  WishlistItem,
  WishlistPriority,
} from "@/lib/types"
import { DEMO_COLLECTION, DEMO_USER, DEMO_WISHLIST } from "@/lib/data/demo"

// -----------------------------------------------------------------------------
// APP STORE
// Single client-side source of truth for the MVP. Mock auth + collection +
// wishlist. State is seeded with the demo collector so the app is populated on
// first open, and persisted to localStorage so actions survive a reload within
// the session. This layer is deliberately isolated so it can be swapped for a
// real API + database without touching the UI components.
// -----------------------------------------------------------------------------

const STORAGE_KEY = "m4wd-state-v1"

interface PersistedState {
  user: User | null
  collection: CollectionItem[]
  wishlist: WishlistItem[]
}

interface AddCollectionInput {
  productId: string
  variantId?: string
  condition: Condition
  acquisitionDate: string
  acquisitionPrice: number
  acquisitionCurrency: Currency
  notes?: string
}

interface AddWishlistInput {
  productId: string
  variantId?: string
  priority: WishlistPriority
  targetPrice?: number
  notes?: string
}

interface Store extends PersistedState {
  hydrated: boolean
  isAuthed: boolean
  login: (email: string) => void
  signup: (input: { email: string; username: string; country: string }) => void
  logout: () => void
  updateUser: (patch: Partial<User>) => void
  addToCollection: (input: AddCollectionInput) => void
  updateCollectionItem: (id: string, patch: Partial<CollectionItem>) => void
  removeFromCollection: (id: string) => void
  addToWishlist: (input: AddWishlistInput) => void
  updateWishlistItem: (id: string, patch: Partial<WishlistItem>) => void
  removeFromWishlist: (id: string) => void
  moveWishlistToCollection: (wishlistId: string, input: Omit<AddCollectionInput, "productId" | "variantId">) => void
  isInCollection: (productId: string) => boolean
  isInWishlist: (productId: string) => boolean
}

const StoreContext = React.createContext<Store | null>(null)

function seedState(): PersistedState {
  return {
    user: DEMO_USER,
    collection: DEMO_COLLECTION,
    wishlist: DEMO_WISHLIST,
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<PersistedState>(seedState)
  const [hydrated, setHydrated] = React.useState(false)

  // hydrate from localStorage after mount to avoid SSR mismatch
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState
        setState(parsed)
      }
    } catch {
      // ignore malformed storage; fall back to seed
    }
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage may be unavailable; state still lives in memory
    }
  }, [state, hydrated])

  const api = React.useMemo<Store>(() => {
    const login: Store["login"] = (email) => {
      setState((s) => ({
        ...s,
        user: {
          ...DEMO_USER,
          email,
          username: email.split("@")[0] || DEMO_USER.username,
        },
      }))
    }

    const signup: Store["signup"] = ({ email, username, country }) => {
      // fresh account starts empty — this is the "new collector" experience
      setState({
        user: {
          id: uid("u"),
          email,
          username,
          country,
          createdAt: new Date().toISOString(),
        },
        collection: [],
        wishlist: [],
      })
    }

    const logout: Store["logout"] = () => {
      setState((s) => ({ ...s, user: null }))
    }

    const updateUser: Store["updateUser"] = (patch) => {
      setState((s) => (s.user ? { ...s, user: { ...s.user, ...patch } } : s))
    }

    const addToCollection: Store["addToCollection"] = (input) => {
      setState((s) => ({
        ...s,
        collection: [
          {
            id: uid("c"),
            userId: s.user?.id ?? DEMO_USER.id,
            photos: [],
            createdAt: new Date().toISOString(),
            ...input,
          },
          ...s.collection,
        ],
      }))
    }

    const updateCollectionItem: Store["updateCollectionItem"] = (id, patch) => {
      setState((s) => ({
        ...s,
        collection: s.collection.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }))
    }

    const removeFromCollection: Store["removeFromCollection"] = (id) => {
      setState((s) => ({ ...s, collection: s.collection.filter((c) => c.id !== id) }))
    }

    const addToWishlist: Store["addToWishlist"] = (input) => {
      setState((s) => ({
        ...s,
        wishlist: [
          {
            id: uid("w"),
            userId: s.user?.id ?? DEMO_USER.id,
            currency: "EUR" as Currency,
            createdAt: new Date().toISOString(),
            ...input,
          },
          ...s.wishlist,
        ],
      }))
    }

    const updateWishlistItem: Store["updateWishlistItem"] = (id, patch) => {
      setState((s) => ({
        ...s,
        wishlist: s.wishlist.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      }))
    }

    const removeFromWishlist: Store["removeFromWishlist"] = (id) => {
      setState((s) => ({ ...s, wishlist: s.wishlist.filter((w) => w.id !== id) }))
    }

    const moveWishlistToCollection: Store["moveWishlistToCollection"] = (wishlistId, input) => {
      setState((s) => {
        const w = s.wishlist.find((x) => x.id === wishlistId)
        if (!w) return s
        return {
          ...s,
          wishlist: s.wishlist.filter((x) => x.id !== wishlistId),
          collection: [
            {
              id: uid("c"),
              userId: s.user?.id ?? DEMO_USER.id,
              productId: w.productId,
              variantId: w.variantId,
              photos: [],
              createdAt: new Date().toISOString(),
              ...input,
            },
            ...s.collection,
          ],
        }
      })
    }

    return {
      ...state,
      hydrated,
      isAuthed: Boolean(state.user),
      login,
      signup,
      logout,
      updateUser,
      addToCollection,
      updateCollectionItem,
      removeFromCollection,
      addToWishlist,
      updateWishlistItem,
      removeFromWishlist,
      moveWishlistToCollection,
      isInCollection: (productId) => state.collection.some((c) => c.productId === productId),
      isInWishlist: (productId) => state.wishlist.some((w) => w.productId === productId),
    }
  }, [state, hydrated])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
