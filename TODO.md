# TODO

## Step 1 — Diagnose server route issue
- [x] Identify why `GET /` on port 3001 returns "Cannot GET /" (server has only `/api/*` and optional `dist/` static serving).
- [ ] Decide whether to build client (`dist/`) or add a simple `GET /` health response on the backend.

## Step 2 — Fix PayPal not going through
- [x] Confirm PayPal env vars are missing (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and frontend `VITE_PAYPAL_CLIENT_ID` are not set).
- [ ] Add/verify correct env configuration (backend + frontend) and restart.
- [ ] Optionally add clearer frontend error if PayPal is missing.

## Step 3 — Verify with manual calls
- [ ] Test `POST /api/payments/create-order` and `POST /api/payments/capture-order` using known dummy data.
- [ ] Confirm PayPal SDK calls succeed (no 500/4xx).

