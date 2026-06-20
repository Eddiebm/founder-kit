# myfounderkit.com — Open Items

Last updated: 2026-06-19.

## Critical (must fix before real formation orders)

- [ ] **`DOOLA_API_KEY` not set** — Formation orders are stored in Neon and Stripe payment is collected, but the Doola API call in `app/api/stripe/webhook/route.ts` silently logs a warning and exits. Orders pile up in DB with `status = 'payment_complete'` and nothing gets filed. Fix: get API key from Doola (requires sales call) or FileForms (emailed info@fileforms.com) and add to Vercel env vars.

- [ ] **`DOOLA_API_KEY` missing from `.env.example`** — Any future developer won't know this var exists. Add it.

## High (before public launch)

- [ ] **Show HN not posted** — Highest-leverage distribution move. Post Tuesday or Wednesday 8–10am ET. Title: "Show HN: I built a tool that matches founders to 100+ grants in 30 seconds". URL: myfounderkit.com.

- [ ] **Annual Stripe price ID missing** — `STRIPE_PRO_ANNUAL_PRICE_ID` is referenced in `app/api/stripe/checkout/route.ts` but not in `.env.example`. Annual billing will throw if someone tries to upgrade annually without this set.

- [ ] **Doola webhook not handled** — Doola fires `company_formation_submitted`, `company_formation_completed`, `document_aoo_uploaded`, `document_einletter_uploaded` events. No webhook endpoint exists to receive them and update `formation_orders.status`. Users get no real-time status updates beyond the initial "payment received" banner.

- [ ] **Formation order admin view missing** — No way to see pending formation orders without querying Neon directly. Need a simple `/command` or admin page listing orders with status so manual processing is possible while Doola key is missing.

## Medium (quality)

- [ ] **`naicsCode` hardcoded to `541990`** — All formations filed under "Other Professional Services" regardless of what the company actually does. Should map from the wizard's entity description or add a dropdown to step 1.

- [ ] **Address parser is best-effort** — `parseAddress()` in the Stripe webhook splits on commas. Structured address fields (street, city, state, zip) would be more reliable. Add them to step 1 of the wizard.

- [ ] **Growth/Series B+ grants thin** — Pre-filter now passes Growth-stage companies through without stage filtering, which is correct, but the DB has no grants explicitly targeting later-stage companies. They see the same pool as Seed-stage.

- [ ] **Wizard IP inventory is blank by default** — Step 2 starts empty. Most users won't know what to put there. Add a short prompt or example items to guide them.

- [ ] **No Stripe Annual price** — The billing page shows a yearly option but `STRIPE_PRO_ANNUAL_PRICE_ID` may not be configured. Verify in Stripe dashboard.

## Resolved

- ✅ Grant scoring returning all "Low" — was Claude Sonnet adding prose before JSON; fixed by switching to Haiku + `response_format: { type: "json_object" }` + wrapping in `{ "scores": [] }`
- ✅ 70-second response time — fixed by pre-filtering grants, streaming SSE, Haiku model
- ✅ Wizard requiring login — removed `/wizard` from `proxy.ts` matcher
- ✅ Growth/Series B+ returning 0 results — fixed in `preFilterGrants`
- ✅ Europe/MENA geographies returning 0 results — added geo matching + 11 new grants
- ✅ `extractWebGrants` JSON parse failures — added `response_format: { type: "json_object" }`
- ✅ Focus area label mismatch ("Climate & Environment" vs "Climate") — normalized in `buildProfileSummary`
- ✅ 40 new grant programs added (Technology & AI, Media & Journalism, Manufacturing, Europe, MENA)
- ✅ MedOS defaults in wizard — cleared company name, foundation, IP items
- ✅ Manual filing instructions dominating step 4 — collapsed behind toggle
- ✅ Formation CTA added to grant results page
- ✅ Doola formation integration built — Stripe checkout, Neon order tracking, wizard "File for me" card
