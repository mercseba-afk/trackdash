"use client"

import * as React from "react"
import type { CollectionItem, Condition, Currency, User, WishlistItem, WishlistPriority } from "@/lib/types"
import { getProductById, primaryRelease } from "@/lib/data/products"
import { createClient } from "@/lib/supabase/client"
import { getMyProfileAction } from "@/lib/actions/profile"
import {
  addCollectionItemAction,
  getMyCollectionAction,
  removeCollectionItemAction,
  updateCollectionItemAction,
} from "@/lib/actions/collection"
import {
  addWishlistItemAction,
  getMyWishlistAction,
  moveWishlistItemToCollectionAction,
  removeWishlistItemAction,
  updateWishlistItemAction,
} from "@/lib/actions/wishlist"

// -----------------------------------------------------------------------------
// APP STORE
// Client-side cache over real, per-user server data. Nothing here is the
// source of truth anymore -- Supabase Auth owns identity/session, and
// Postgres (via the Server Actions in lib/actions/*) owns collection and
// wishlist. This store's job is just to hold what was last fetched/written
// so screens can keep reading it synchronously via useStore(), same as
// before.
//
// Step 4B: collection/wishlist are no longer localStorage-backed -- that
// was Step 4A's deliberate scope cut, made possible now by the stable
// catalog ids from lib/data/stable-id.ts (see products.ts) matching the
// real seeded database rows. Fetched fresh on sign-in and kept in sync by
// re-fetching from the server after each mutation, rather than optimistic
// local patching -- simpler and correct by construction, at the cost of
// one extra round trip per action, an acceptable trade for an MVP.
// -----------------------------------------------------------------------------

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

interface Store {
  hydrated: boolean
  isAuthed: boolean
  user: User | null
  collection: CollectionItem[]
  wishlist: WishlistItem[]
  logout: () => Promise<void>
  updateUser: (patch: Partial<User>) => void
  addToCollection: (input: AddCollectionInput) => Promise<void>
  updateCollectionItem: (id: string, patch: Partial<CollectionItem>) => Promise<void>
  removeFromCollection: (id: string) => Promise<void>
  addToWishlist: (input: AddWishlistInput) => Promise<void>
  updateWishlistItem: (id: string, patch: Partial<WishlistItem>) => Promise<void>
  removeFromWishlist: (id: string) => Promise<void>
  moveWishlistToCollection: (
    wishlistId: string,
    input: Omit<AddCollectionInput, "productId" | "releaseId">,
  ) => Promise<void>
  isInCollection: (productId: string) => boolean
  isInWishlist: (productId: string) => boolean
}

const StoreContext = React.createContext<Store | null>(null)

// Combines the Supabase Auth identity (id, email, created_at -- always
// present once there's a session) with our own `profiles` row (username,
// country, ... -- may briefly be null right after sign-up if the
// auto-provisioning trigger hasn't committed yet; falls back to an
// email-derived placeholder rather than showing "undefined").
function toAppUser(
  authUser: { id: string; email?: string; created_at: string },
  profile: Awaited<ReturnType<typeof getMyProfileAction>>,
): User {
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
  const [user, setUser] = React.useState<User | null>(null)
  const [authChecked, setAuthChecked] = React.useState(false)
  const [collection, setCollection] = React.useState<CollectionItem[]>([])
  const [wishlist, setWishlist] = React.useState<WishlistItem[]>([])
  const [dataLoaded, setDataLoaded] = React.useState(false)

  async function refetchCollectionAndWishlist() {
    const [c, w] = await Promise.all([getMyCollectionAction(), getMyWishlistAction()])
    setCollection(c)
    setWishlist(w)
  }

  // Real auth: resolve the current Supabase session on mount, then stay in
  // sync via onAuthStateChange (fires on sign-in, sign-out, token refresh --
  // including sign-ins that happen client-side in auth-screen.tsx, which
  // this store doesn't call directly). Once a session resolves, also loads
  // that user's real collection/wishlist; on sign-out, clears them rather
  // than leaving the previous user's data on screen.
  React.useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function syncUser(authUser: { id: string; email?: string; created_at: string } | null) {
      if (!authUser) {
        if (!cancelled) {
          setUser(null)
          setCollection([])
          setWishlist([])
          setDataLoaded(true)
        }
        return
      }
      const profile = await getMyProfileAction()
      if (cancelled) return
      setUser(toAppUser(authUser, profile))
      try {
        await refetchCollectionAndWishlist()
      } finally {
        if (!cancelled) setDataLoaded(true)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUser(session?.user ?? null).finally(() => {
        if (!cancelled) setAuthChecked(true)
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setDataLoaded(false)
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
      // onAuthStateChange above will clear user/collection/wishlist.
    }

    const updateUser: Store["updateUser"] = (patch) => {
      // Local-only for now -- no server action persists profile edits yet.
      // Kept so the existing profile/settings screens have something to
      // call without crashing; wiring it to a real update is future work,
      // not part of this step.
      setUser((u) => (u ? { ...u, ...patch } : u))
    }

    const addToCollection: Store["addToCollection"] = async (input) => {
      await addCollectionItemAction(input)
      await refetchCollectionAndWishlist()
    }

    const updateCollectionItem: Store["updateCollectionItem"] = async (id, patch) => {
      await updateCollectionItemAction(id, patch)
      await refetchCollectionAndWishlist()
    }

    const removeFromCollection: Store["removeFromCollection"] = async (id) => {
      await removeCollectionItemAction(id)
      setCollection((c) => c.filter((item) => item.id !== id))
    }

    const addToWishlist: Store["addToWishlist"] = async (input) => {
      await addWishlistItemAction(input)
      await refetchCollectionAndWishlist()
    }

    const updateWishlistItem: Store["updateWishlistItem"] = async (id, patch) => {
      await updateWishlistItemAction(id, patch)
      await refetchCollectionAndWishlist()
    }

    const removeFromWishlist: Store["removeFromWishlist"] = async (id) => {
      await removeWishlistItemAction(id)
      setWishlist((w) => w.filter((item) => item.id !== id))
    }

    const moveWishlistToCollection: Store["moveWishlistToCollection"] = async (wishlistId, input) => {
      const wishlistItem = wishlist.find((w) => w.id === wishlistId)
      // The wishlist item may already pin a specific release; if it was
      // added as "any edition", fall back to the model's primary release --
      // resolved synchronously from the (now id-matching) local catalog
      // data, same as Step 4A did, since there's no concrete release
      // selection step in the wishlist "I got it" flow's UI.
      let releaseId = wishlistItem?.releaseId
      if (!releaseId && wishlistItem) {
        const product = getProductById(wishlistItem.productId)
        releaseId = product ? primaryRelease(product).id : undefined
      }
      if (!releaseId) throw new Error("Could not resolve a release for this wishlist item")

      await moveWishlistItemToCollectionAction(wishlistId, {
        releaseId,
        condition: input.condition,
        acquisitionDate: input.acquisitionDate,
        acquisitionPrice: input.acquisitionPrice,
        acquisitionCurrency: input.acquisitionCurrency,
        releaseYearOverride: input.releaseYearOverride,
        notes: input.notes,
      })
      await refetchCollectionAndWishlist()
    }

    return {
      hydrated: authChecked && dataLoaded,
      isAuthed: Boolean(user),
      user,
      collection,
      wishlist,
      logout,
      updateUser,
      addToCollection,
      updateCollectionItem,
      removeFromCollection,
      addToWishlist,
      updateWishlistItem,
      removeFromWishlist,
      moveWishlistToCollection,
      isInCollection: (productId) => collection.some((c) => c.productId === productId),
      isInWishlist: (productId) => wishlist.some((w) => w.productId === productId),
    }
  }, [user, collection, wishlist, authChecked, dataLoaded])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
