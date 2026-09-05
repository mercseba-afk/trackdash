# TrackDash — Password Reset (Forgot/Update Password)

Short, operational reference for the forgot/reset password flow. Not a
design document — see the code itself
(`app/forgot-password`, `app/update-password`, `app/auth/callback`,
`components/screens/forgot-password-screen.tsx`,
`components/screens/update-password-screen.tsx`, `proxy.ts`) for the
implementation.

## Flow

```
/login → "Forgot password?"
  → /forgot-password (enter email)
     → supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + /auth/callback?next=/update-password })
     → ALWAYS shows the same generic message, regardless of whether the
       email has an account (no account-enumeration signal)
  → user clicks the emailed link
  → /auth/callback (Route Handler) exchanges the PKCE `code` for a real
    session via supabase.auth.exchangeCodeForSession(code)
     → redirects to /update-password (the only allowlisted `next`)
     → on a failed/expired/reused code, redirects to /update-password
       anyway, WITHOUT a session -- that page shows the invalid-link
       state itself
  → /update-password checks for a session on mount
     → no session -> "Link invalid or expired" + link back to
       /forgot-password
     → session present -> new password + confirm form ->
       supabase.auth.updateUser({ password })
     → success -> "Continue to your garage" (session is already active;
       no separate re-login step)
```

## Why a route handler, not a page, for the callback

Exchanging a PKCE `code` for a session must happen server-side (it sets
httpOnly cookies). `app/auth/callback/route.ts` reuses the existing
`lib/supabase/server.ts` client — no new Supabase client construction,
no duplicated cookie-handling logic.

## Redirect safety

`app/auth/callback/route.ts` only ever redirects to a path in a small
hardcoded `ALLOWED_NEXT_PATHS` set (currently just `/update-password`).
The `next` query param is checked against that set and never used
verbatim — there is no way to make this callback redirect to an external
host or an arbitrary internal path.

## `proxy.ts` route treatment

- `/forgot-password` is in `PUBLIC_PATHS` — same treatment as `/login`
  and `/signup` (reachable when signed out; bounced to `/` when already
  signed in).
- `/auth/callback` and `/update-password` are in `UNGATED_PREFIXES` —
  **not** merely public. A user who just followed a real recovery link
  has, by the time they reach `/update-password`, a genuine Supabase
  session (created by the callback's code exchange) — indistinguishable
  from an ordinary login session to `supabase.auth.getUser()`. If
  `/update-password` were in `PUBLIC_PATHS`, the existing "signed-in +
  public path → redirect to `/`" rule would immediately bounce the user
  away and break the whole flow. Ungating both routes means neither
  redirect rule applies to them; each route/page decides for itself what
  to render based on whether a session exists.

## Required Supabase Dashboard configuration

Not changed by this pass (explicitly out of scope — this only documents
what the live project needs):

- **Site URL** — must be TrackDash's real production origin. Supabase
  uses this as the base for any relative `redirectTo` and for its own
  email templates.
- **Redirect URLs (allowlist)** — must include
  `{origin}/auth/callback` (the exact path this flow calls
  `resetPasswordForEmail` with). Supabase rejects a `redirectTo` that
  isn't on this allowlist.
- **Recovery email template** — the **standard default Supabase
  "Reset Password" template is sufficient** for this PKCE flow; it
  already links to `{{ .SiteURL }}/auth/callback?...&type=recovery`-style
  URLs when `redirectTo` is set as above. No custom template is required
  by this implementation. (If the project ever adds a *custom* email
  template, its action link must still point at `/auth/callback` with
  `code=...`, not a hand-built link — Supabase generates the `code` for
  you.)
- No other recovery-specific route/page needs a Dashboard entry:
  `/update-password` is reached via the callback's own redirect, not
  hit directly by an email link.

## Privacy: no account enumeration

`ForgotPasswordScreen` shows the identical success message whether or
not `email` has an account. `resetPasswordForEmail` itself is called the
same way regardless, and any error it returns (rate limiting, network)
is swallowed silently rather than surfaced differently from the success
case — the UI state is `submitted`, not `success`/`emailNotFound`.

## Validation

`UpdatePasswordScreen`: non-empty password, non-empty confirmation,
matching password/confirmation, and a 6-character minimum — the same
minimum already used at signup (`components/screens/auth-screen.tsx`),
not a new/stricter rule invented for this flow. Supabase's own
`updateUser` error (e.g. "should be different from the old password") is
shown as-is; it's a validation message, not internal detail.

## What this pass did NOT touch

Login, signup, session refresh (`lib/supabase/proxy.ts`), and
`AuthGate` — none were modified. The only auth-adjacent file changed is
`proxy.ts` (new path lists) and `components/screens/auth-screen.tsx`
(one added `Link`).
