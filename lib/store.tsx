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

  // Tracks the id of the currently-loaded (or currently-loading) user, for
  // use inside the onAuthStateChange callback below. A plain state
  // variable would be stale there: that callback is registered once by
  // the effect (dependency array []) and closes over values from mount
  // time, not the latest render -- a ref is the standard way around that.
  const currentUserIdRef = React.useRef<string | null>(null)

  async function refetchCollectionAndWishlist() {
    const [c, w] = await Promise.all([getMyCollectionAction(), getMyWishlistAction()])
    setCollection(c)
    setWishlist(w)
  }

  // Real auth: resolve the current Supabase session once on mount via
  // getSession(), then stay in sync via onAuthStateChange for everything
  // that happens afterwards. Fix (this branch): Supabase fires
  // onAuthStateChange for far more than "a different person logged in" --
  // regaining tab focus alone triggers TOKEN_REFRESHED and sometimes a
  // same-user SIGNED_IN, and every subscription also immediately replays
  // an INITIAL_SESSION event. Treating all of those identically to a real
  // sign-in (full reload, `dataLoaded` flipped to false) was what made the
  // whole app flash to a loading screen every time someone switched back
  // to this tab -- AuthGate renders that state as a blank screen + spinner
  // while `hydrated` (== authChecked && dataLoaded) is false. The fix is
  // to only ever do that full reload for an ACTUAL identity change (a real
  // sign-in, a sign-out, or switching to a genuinely different account);
  // everything else either updates quietly or does nothing at all. See
  // each case below for the reasoning specific to that event.
  React.useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    // The only path allowed to blank the UI (via setDataLoaded(false) at
    // its call sites below) -- resolves the profile + collection +
    // wishlist for a new/changed user, or clears everything on sign-out.
    //
    // Race guard: currentUserIdRef also doubles as this function's "is my
    // result still relevant" check. Two async steps happen here (profile,
    // then collection/wishlist) with real await points in between, during
    // which another event (a sign-out, or a sign-in as someone else) can
    // change currentUserIdRef out from under an in-flight call for the
    // PREVIOUS user. Checking only `cancelled` (component unmounted) isn't
    // enough -- the component is still mounted and happily accepting
    // updates in that scenario, it's just that this particular call's
    // result no longer belongs to the current session. Re-checking
    // `currentUserIdRef.current === authUser.id` after every await, before
    // touching any state, is what makes a superseded call a true no-op
    // instead of momentarily showing (or, worse, persisting a mutation
    // against) the wrong account's data.
    async function fullSync(authUser: { id: string; email?: string; created_at: string } | null) {
      if (!authUser) {
        currentUserIdRef.current = null
        if (!cancelled) {
          setUser(null)
          setCollection([])
          setWishlist([])
          setDataLoaded(true)
        }
        return
      }
      // Set synchronously, before the async profile fetch below, so a
      // second event for the same user arriving mid-flight (e.g. a rapid
      // SIGNED_IN immediately followed by TOKEN_REFRESHED) sees this
      // user as already-current and bails out early rather than starting
      // a second, redundant fetch.
      currentUserIdRef.current = authUser.id

      const profile = await getMyProfileAction()
      if (cancelled || currentUserIdRef.current !== authUser.id) return
      setUser(toAppUser(authUser, profile))

      try {
        const [c, w] = await Promise.all([getMyCollectionAction(), getMyWishlistAction()])
        if (cancelled || currentUserIdRef.current !== authUser.id) return
        setCollection(c)
        setWishlist(w)
      } finally {
        // Only this user's own (still-current) call gets to mark the
        // load as done. A superseded call reaching here must NOT flip
        // dataLoaded to true -- whichever fullSync is actually running
        // for the current user is responsible for that itself, once its
        // own checks above pass.
        if (!cancelled && currentUserIdRef.current === authUser.id) setDataLoaded(true)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      fullSync(session?.user ?? null).finally(() => {
        if (!cancelled) setAuthChecked(true)
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case "INITIAL_SESSION":
          // Fires once, immediately after subscribing, describing the
          // same session getSession() above is already resolving.
          // Reacting to it too would just do the initial bootstrap
          // twice; getSession() is the single source of truth for it.
          return

        case "SIGNED_OUT":
          // A real identity change (to "nobody") -- always clear
          // everything immediately. fullSync(null) resolves
          // synchronously (no network round trip, no await), so this
          // doesn't need a preceding setDataLoaded(false) to avoid a
          // stale screen, AND it's what makes the race guard above work:
          // currentUserIdRef.current becomes null right here, so any
          // still-in-flight fullSync(previousUser) call correctly sees
          // a mismatch the next time it checks.
          fullSync(null)
          return

        case "TOKEN_REFRESHED":
          // Same session, same user, new access token. Nothing about
          // identity or app data changed -- do nothing.
          return

        case "USER_UPDATED": {
          // Something about the auth user itself changed (confirmed
          // email, updated metadata, ...). Refresh the profile quietly
          // in place -- never touch dataLoaded/collection/wishlist for
          // this, the rest of the UI has no reason to disappear.
          const authUser = session?.user
          if (!authUser) return
          getMyProfileAction().then((profile) => {
            // Same race guard as fullSync: if the account changed while
            // this fetch was in flight, this response is stale and must
            // not overwrite whatever the current session's own sync
            // already set.
            if (!cancelled && currentUserIdRef.current === authUser.id) {
              setUser(toAppUser(authUser, profile))
            }
          })
          return
        }

        case "SIGNED_IN": {
          // Supabase also emits SIGNED_IN when an existing session is
          // merely reconfirmed (notably: regaining tab focus), not only
          // for an actual new login. If the session's user matches the
          // one already loaded, there is nothing to do -- treat it like
          // TOKEN_REFRESHED.
          const authUser = session?.user
          if (!authUser) return
          if (currentUserIdRef.current === authUser.id) return
          // A genuinely new sign-in (including switching to a different
          // account without an intervening sign-out): full reload, and
          // showing the loading state here is the correct, expected
          // behavior -- never carry the previous user's data across.
          setDataLoaded(false)
          fullSync(authUser)
          return
        }

        default:
          // Any other/future auth event: do nothing rather than risk
          // blanking the UI for something not explicitly handled above.
          return
      }
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
