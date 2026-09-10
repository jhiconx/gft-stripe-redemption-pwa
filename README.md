# gft-stripe-redemption-pwa

Working HTML / PWA prototype for the GFT Rewards funding, waterfall and shopper-payout flow.

## What changed in this version

- The shopper-facing debit card is now called **Chili Rewards Debit Card**.
- A persistent **Credits** banner now appears on **every page** in the phone prototype.
- The credits module uses the **USDC logo** and displays **485,400 credits**.
- The final shopper wallet screen shows the **Chili Rewards Debit Card** with a $3.00 reward and a right-side **Credits** panel.
- `Build A Campaign` opens `https://admin.gftrewards.com/` in a new tab.
- The waterfall UI displays values with two decimal places.
- The BRD side explicitly includes the AI operating-model language and the persistent-credits requirement.

## Files

- `index.html` — main two-column BRD + prototype page
- `app.js` — interactive prototype state and screen logic
- `styles.css` — all styling
- `manifest.webmanifest` — PWA manifest
- `sw.js` — simple network-first service worker
- `vercel.json` — Vercel static deployment config
- `assets/reference-flow.png` — architecture reference image
- `assets/usdc-logo.png` — USDC credit icon used in the persistent credits module

## Run locally

Open `index.html` in a browser, or serve the folder with any static server.

## Deploy to Vercel

1. Create a GitHub repository named `gft-stripe-redemption-pwa`.
2. Upload all files in this package to the repository root.
3. Import the repository into Vercel.
4. Framework preset: **Other**.
5. Build command: leave blank.
6. Output directory: leave blank.
7. Deploy.

- The top credits banner no longer says "visible on every page" and is right-aligned closer to the 485,400 balance.
- The shopper reward link now skips the intermediate phone-entry screen and opens straight to the Chili Rewards Debit Card screen.
- The first onboarding screen now shows: **Powered by Chili Debit Card**.
