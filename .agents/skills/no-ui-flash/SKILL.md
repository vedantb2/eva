---
name: no-ui-flash
description: Use when an SPA or SSR app flashes the wrong UI before client-side data resolves — an app-shell skeleton shown to visitors who get bounced to login, a results skeleton before "no results found", a light-theme flash before dark mode, a generic placeholder that swaps to something jarringly different. Covers resolving state at the edge/server, optimistic hint cookies, redirect-back (returnTo) flows, and how to test the loading window.
---

# Never flash the wrong UI

Client-rendered apps have a window between first paint and the moment client-side data resolves. The classic bug is filling that window with a placeholder that bets on one outcome — and losing the bet:

- An **app-shell skeleton** (sidebar, nav, content cards) shown to a signed-out visitor who is about to be bounced to login. They're shown an app they'll never reach, then a jarring swap.
- A **results-grid skeleton** on a search/list page that resolves to "no results found" — the skeleton promised content that doesn't exist.
- A **light-theme first paint** that snaps to dark once a preference loads.
- A skeleton for a route that turns out to be a **404**.

The rule: **render the placeholder for the state you have verified, not the state you hope for.** When you can't verify, render a placeholder that's correct in _every_ outcome (neutral, layout-stable) — not the happy path's. Getting there is three layers; each makes the next one's job smaller.

## Layer 1 — resolve the state at the edge, before the document is served

The server/edge that serves the SPA's HTML usually already holds what the client will spend a round trip discovering. Use it there:

- **Auth**: most session schemes verify with **no upstream round trip** — sealed/signed cookies verify with local crypto, JWTs against a cached JWKS. Gate document requests: signed out → `302 /login?returnTo=<path>` before any app HTML exists. The wrong shell can't flash if it's never served. Anyone who receives the SPA at a gated path is now _known_ to be signed in — which makes the client's skeleton honest again.
- **Data-shaped states**: if the edge can cheaply answer "empty vs. populated" (a count, a KV flag, a cookie recording last-known state), it can serve the right variant — empty-state HTML, the populated shell, a redirect to onboarding — instead of a one-skeleton-fits-all document.
- **Preferences** (theme, locale, density): read the preference cookie at the edge and serve the correct variant in the initial HTML. A class on `<html>` beats a client-side flip.

Edge cases that bite (described for auth, but they generalize to any cookie-carried state):

- **Gate document navigations only** (GET/HEAD with `sec-fetch-dest: document`, falling back to `Accept: text/html`). API routes, module requests, and health probes answer for themselves.
- **Clear invalid state carriers, don't just route around them.** A cookie that fails validation is worse than none — anything keyed on its _presence_ keeps misbehaving until it's gone. Expire it on the response.
- **Persist anything the check rotated.** If verification refreshed a token, the new value MUST reach the browser on this response — refresh tokens are typically single-use, and dropping the rotation silently breaks the session later. Applies on the serve path, not just redirects.
- Failures inside the edge check collapse to the _safe_ state (signed out, default theme), never to a 500.

## Layer 2 — a hint cookie for instant correct paints

Whatever the client normally learns from its first probe (`/me`, first search, preferences fetch), snapshot it into a non-HttpOnly cookie so the _next_ load paints correctly without waiting:

- The client **writes** it whenever the server confirms the state, and **reads** it on the next load to seed an optimistic version while the probe is in flight. (Auth: identity display data. Search/list: "this account has data" or last result count. Theme: the resolved preference.)
- It is a **hint, never an authority**. Real authorization and real data still come from the server; a stale or forged hint can only change which placeholder briefly renders. Keep the payload to display data the user already knows; schema-validate on read and treat anything malformed as absent.
- The resolved probe **always wins** — reconcile the moment it lands.
- **Clear it everywhere the underlying state dies** (logout, account wipe, preference reset) — server-side on those responses, and client-side when a probe contradicts it. A hint that outlives its truth paints the wrong UI confidently.
- In an SSR/hydrating app, read the cookie **after mount** (effect/state), not during the first render — the first client render must match the server HTML. The flip costs one frame, not a round trip.

With layers 1+2, the client's "loading" placeholder is only reachable in states where it's genuinely correct (e.g. a verified user's first visit on a new browser) — so the optimistic skeleton is finally honest.

## Layer 3 — the client fallback becomes a safety net

The in-app state gate no longer handles fresh loads; it handles **mid-session change** (logout in another tab, expiry, data deleted elsewhere):

- On a state that invalidates the current UI, transition via a full navigation and render something neutral (a blank themed screen) for the moment that takes — never the placeholder of the UI they just lost.
- Unknown routes need a real 404 page, not the shell or skeleton. If there's no `notFound` route, the fallback is probably the thing accidentally rendering a skeleton for garbage URLs — check.

## Redirect-back (returnTo) for gates that bounce

If the edge redirects (login, onboarding), deep links must survive the detour. Resist adding a second cookie for it — if the flow is OAuth-shaped, the `state` parameter already round-trips through the provider verbatim and is already authenticated by the CSRF check (state pinned in a cookie, compared timing-safe at the callback). Ride along: `state = base64url(JSON { nonce, returnTo })`. One value, one cookie, and an attacker can't swap the destination without breaking the comparison.

Wherever a returnTo enters (gate query, login page, callback's decoded state), validate it as a **same-origin relative path**: starts with `/`, not `//` (protocol-relative is an absolute URL in disguise), and not an API path. Anything else falls back to `/`. Decoding must be total — providers send callbacks with state you never minted; junk reads as "no returnTo", never a throw.

## Testing the loading window

The bug lives in a timing window, so the test must hold the window open:

- **Intercept the probe** and delay it (e.g. Playwright `page.route` on `/me` or the search endpoint with a sleep). Assert what is painted _during_ the delay: for the bounced visitor, the destination page with zero skeleton elements; for the hinted user, the real UI — plus a flag proving the probe had not resolved when it painted.
- **Drive the full redirect round trip** over the wire: gated deep link → redirect carrying returnTo → provider → callback → lands on the deep link. Then the forged version: an off-origin returnTo completes the flow but lands on `/`.
- **Assert cookie hygiene as Set-Cookie headers**: invalid state carrier → cleared (Max-Age=0) alongside its hint; the death event (logout etc.) → both gone.
- **Drive the rotation path without waiting out expiry**: if the carrier is a sealed cookie, unseal it with the same library the server uses, corrupt the inner token's signature, reseal. The edge sees invalid-but-refreshable: assert the page is served, the rotated value is set on the response, and the spent one is refused on replay.
