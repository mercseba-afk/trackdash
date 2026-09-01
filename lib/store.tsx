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
import { DEMO_COLLECTION, DEMO_WISHLIST } from "@/lib/data/demo"
import { getProductById, primaryRelease } from "@/lib/data/products"
import { createClient } from "@/lib/supabase/client"
import { getMyProfileAction } from "@/lib/actions/profile"

// -----------------------------------------------------------------------------
// APP STORE
// Client-side source of truth for the MVP UI.
//
// Step 4: the `user` slice is now real — backed by an actual Supabase Auth
// session (lib/supabase/client.ts) plus the matching `profiles` row
// (fetched via the getMyProfileAction server action, since Drizzle/the
// database are server-only). login()/signup() as store methods are gone;
// components/screens/auth-screen.tsx now calls Supabase directly, and this
// store reacts to the resulting session via onAuthStateChange below —
// there's no other way for the store to "cause" a login/signup itself
// anymore, which is intentional: Supabase Auth is the only place that
// decision gets made.
//
// `collection` and `wishlist` are UNCHANGED from Step 3: still local state
// seeded from lib/data/demo.ts and persisted to localStorage. Wiring them
// to real per-user persistence surfaced a genuine blocker (collection/
// wishlist rows have a NOT NULL foreign key into the catalog tables, which
// are empty — the demo catalog's ids aren't even valid uuids), which needs
// a decision before touching this half of the store. See the Step 4 report
// for the two options that were identified.
// -----------------------------------------------------------------------------

// v2: collection/wishlist items now reference a specific release (releaseId)
// instead of a variantId, and support a per-item releaseYearOverride.
const STORAGE_KEY = "m4wd-state-v2"

interface PersistedState {
  collection: CollectionItem[]
  wishlist: WishlistItem[]
}

interface AddCollectionInput {
  productId: string
  releaseId: string
  condition: Condition
  acquisitionDate: string
  acquisitionPrice: number
  acquisitionCurrency: Currency
  releaseYearOverride?: number
  notes?: string
}

interface AddWishlistInput {
  productId: string
  releaseId?: string
  priority: WishlistPriority
  targetPrice?: number
  notes?: string
}

interface Store extends PersistedState {
  hydrated: boolean
  isAuthed: boolean
  user: User | null
  logout: () => Promise<void>
  updateUser: (patch: Partial<User>) => void
  addToCollection: (input: AddCollectionInput) => void
  updateCollectionItem: (id: string, patch: Partial<CollectionItem>) => void
  removeFromCollection: (id: string) => void
  addToWishlist: (input: AddWishlistInput) => void
  updateWishlistItem: (id: string, patch: Partial<WishlistItem>) => void
  removeFromWishlist: (id: string) => void
  moveWishlistToCollection: (wishlistId: string, input: Omit<AddCollectionInput, "productId" | "releaseId">) => void
  isInCollection: (productId: string) => boolean
  isInWishlist: (productId: string) => boolean
}

const StoreContext = React.createContext<Store | null>(null)

function seedState(): PersistedState {
  return {
    collection: DEMO_COLLECTION,
    wishlist: DEMO_WISHLIST,
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

// Combines the Supabase Auth identity (id, email, created_at — always
// present once there's a session) with our own `profiles` row (username,
// country, ... — may briefly be null right after sign-up if the
// auto-provisioning trigger hasn't committed yet; falls back to an
// email-derived placeholder rather than showing "undefined").
function toAppUser(authUser: { id: string; email?: string; created_at: string }, profile: Awaited<ReturnType<typeof getMyProfileAction>>): User {
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    username: profile?.username ?? authUser.email?.split("@")[0] ?? "collector",
    country: profile?.country ?? "",
    createdAt: authUser.created_at,
    avatarUrl: profile?.avatarUrl ?? undefined,
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<PersistedState>(seedState)
  const [collectionWishlistHydrated, setCollectionWishlistHydrated] = React.useState(false)
  const [user, setUser] = React.useState<User | null>(null)
  const [authChecked, setAuthChecked] = React.useState(false)

  // hydrate collection/wishlist from localStorage after mount to avoid SSR
  // mismatch — unchanged from Step 3.
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
    setCollectionWishlistHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!collectionWishlistHydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage may be unavailable; state still lives in memory
    }
  }, [state, collectionWishlistHydrated])

  // Real auth: resolve the current Supabase session on mount, then stay in
  // sync via onAuthStateChange (fires on sign-in, sign-out, token refresh —
  // including sign-ins that happen client-side in auth-screen.tsx, which
  // this store doesn't call directly).
  React.useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function syncUser(authUser: { id: string; email?: string; created_at: string } | null) {
      if (!authUser) {
        if (!cancelled) setUser(null)
        return
      }
      const profile = await getMyProfileAction()
      if (!cancelled) setUser(toAppUser(authUser, profile))
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUser(session?.user ?? null).finally(() => {
        if (!cancelled) setAuthChecked(true)
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const api = React.useMemo<Store>(() => {
    const logout: Store["logout"] = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      // onAuthStateChange above will clear `user`; nothing else to do here.
    }

    const updateUser: Store["updateUser"] = (patch) => {
      // Local-only for now — no server action persists profile edits yet.
      // Kept so the existing profile/settings screens have something to
      // call without crashing; wiring it to a real update is future work,
      // not part of this step.
      setUser((u) => (u ? { ...u, ...patch } : u))
    }

    const addToCollection: Store["addToCollection"] = (input) => {
      setState((s) => ({
        ...s,
        collection: [
          {
            id: uid("c"),
            userId: user?.id ?? "local",
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
            userId: user?.id ?? "local",
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
        const product = getProductById(w.productId)
        const releaseId = w.releaseId ?? (product ? primaryRelease(product).id : `${w.productId}-r1`)
        return {
          ...s,
          wishlist: s.wishlist.filter((x) => x.id !== wishlistId),
          collection: [
            {
              id: uid("c"),
              userId: user?.id ?? "local",
              productId: w.productId,
              releaseId,
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
      hydrated: collectionWishlistHydrated && authChecked,
      isAuthed: Boolean(user),
      user,
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
  }, [state, collectionWishlistHydrated, user, authChecked])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
