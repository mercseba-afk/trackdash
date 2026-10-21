# CREATIVEWEB staging checkpoint — 2026-10-21

## Authorization and completed work

User explicitly authorized connecting the repository, selecting recovery/frankfurt-migration as Production branch, and proceeding toward going online. No purchases, destructive changes, or old database changes are authorized.

- Vercel team CREATIVEWEB / creativeweb: team_5nyrvbz7upFl0g3ZtKAA5noh.
- Existing new project trackdash: prj_wO1bW1O2rfQLcPnlrEJ86YuOwBgw, Hobby.
- Connected GitHub repository mercseba-afk/trackdash; Production branch recovery/frankfurt-migration saved.
- Build command pnpm build (package build script already runs pnpm verify). Node 24.x, install pnpm install --frozen-lockfile.
- Frankfurt fra1 is the sole configured function region. Cron Jobs remain Disabled; EBAY_MARKET_WRITES_ENABLED remains false.
- Complete recovery tree fe3c39f9ec56d10e819b89258e16db6f04bccf60 was published as commit 097bf91089bc7a7d6b8e153e44d7b42f969e7669 on top of PR434 base 3db96bd67a706fb507b41ce6d743296521782206. It exactly matched the locally verified tree. pnpm verify passed before publication.
- First manual Production deployment: dashboard identifier 2mTFxZbr4jgx7VDn9MX8SgFaeP4u, Ready.
- Technical URL: https://trackdash-2370wo4ew-creativeweb.vercel.app . No custom domain transferred.

## Verified observations

- GET /api/version returned JSON version 097bf91089bc7a7d6b8e153e44d7b42f969e7669.
- Public catalog rendered. /market is a public landing page with aggregate statistics; live lists require login by design. Do not confuse that page with Release data verification.
- Independent direct browser observation of /catalog/dyna-hawk-gx/releases/95467-dyna-hawk-gx-super-xx-special-2019-reissue confirmed public Release #95467: Stima TrackDash 14.92 EUR, requested price 46.36 EUR excluding shipping, one extra-EU seller. No database permission/TLS error visible. These are observed values, not a claim that every Release has been retested.
- GET /api/ebay/marketplace-account-deletion?challenge_code=trackdash-preflight-20261021 returned ENDPOINT_NOT_CONFIGURED. No notification POST or scan was sent.

## Remaining gates before full restoration

- New Vercel has nine Production-only variables. DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY are Secret. Dedicated restricted DB role was prepared previously; secrets are not stored in this document.
- Missing EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, EBAY_MARKETPLACE_DELETION_TOKEN; also cron/worker authorization configuration must be recovered and reconciled before enabling workers. The registered deletion endpoint still belongs to the old technical alias trackdash-dusky.vercel.app. Restore a working verified subscription endpoint before claiming full eBay operation.
- Authentication/email flows were genuinely tested on the Frankfurt backend on October 19, but have NOT been retested on this new host. Confirm allowed callback/redirect URLs before repeating those tests; do not claim old tests prove this host.
- Domain trackdash.it has NOT moved. Original Supabase and original Vercel project were not changed during this work. No duplicate scanner was enabled.
- Xheba remained offline when checked October 21, so locally protected recovery credentials cannot currently be recovered through it. Provider sign-in is the remaining access route.

## Access limitations

Vercel connector identifies the correct team but project reads return 404/list is empty despite browser-confirmed IDs. UI exposes no project-select authorization control for its existing token. Direct terminal access to api.vercel.com is blocked by network policy; CLI login did not save credentials. Do not repeatedly request the same device authorization or infer a successful CLI login. Browser UI was used with explicit user authorization. GitHub connector writes succeeded; terminal git push lacked credentials. No tokens/passwords should be requested or displayed in chat.

Automatic Vercel Git deployments are disabled for the recovery branch in vercel.json; this documentation checkpoint must not be treated as a tested replacement deployment. The deployed application remains the exact commit cited above.
