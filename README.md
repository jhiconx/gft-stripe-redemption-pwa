## BRD v3 visible requirement

The BRD now places this requirement directly under the BRD introduction so it is visible without opening another tab:

> All of this will take place in a clean, AI autonomous actions, **structured data handling,** RAG (Retrieval-Augmented Generation), MCP and agents using loops and dynamic workflows.

The service worker is network-first in v3 so Vercel deployments do not keep showing an older cached BRD.

# gft-stripe-redemption-pwa Prototype

Deploy-ready static PWA with the Business Requirements Document on the left and an interactive mobile prototype on the right.

## Current product requirements represented in the prototype

- The onboarding screen begins with **“Welcome to GFT, Let’s Get Started.”**
- **Build A Campaign** opens the live GFT campaign admin at `https://admin.gftrewards.com/`.
- **Enter Your Banking Information** launches a Plaid-style demo form using fictional values only.
- Brand fiat moves into the GFT Bank of America master-account flow. GFT records the source/brand relationship while Bridge converts fiat to USDC and funds the GFT Coke custodial wallet.
- Coke portfolio example: **$1,000,000 funded**, with campaigns of **$400,000 / $200,000 / $350,000** at **42% / 54% / 92% redeemed**.
- Each redemption generates a **$0.75 GFT fee**. Visible waterfall amounts use **two decimal places**.
- Waterfall rules: Grocer $0.10, Publisher/Agency $0.20, POS Partner $0.02, Stripe Partner $0.005 underlying rule. The interface uses cent-rounded display values.
- GFT programs the waterfall first. Stakeholder Privy wallets are created only after the GFT ledger state exists, mirroring the balances/rules already defined by GFT.
- Stripe payout rules can then route stakeholder value in fiat or USDC.
- Shopper payout simulation: **$3.00 Coke redemption → Load to Card → text message → reward link → phone-number entry → iPhone/Android selection → Coke Debit card in the selected mobile wallet with $3.00 in rewards**.

## Files

- `index.html` — page shell, BRD and prototype containers
- `styles.css` — responsive UI and phone/PWA styling
- `app.js` — interactive prototype logic
- `manifest.webmanifest` — PWA metadata
- `sw.js` — service worker
- `vercel.json` — Vercel static deployment configuration
- `assets/` — PWA icons and architecture reference image

## Local preview

From the project directory:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## GitHub → Vercel

This project is intentionally static and needs no build command.

1. Create a new GitHub repository and put the contents of this folder at the **repository root**.
2. In Vercel, import that GitHub repository.
3. Use **Other** / no framework preset if Vercel asks for a framework.
4. Leave the root directory as the repository root and leave the build command blank.
5. Deploy. Future pushes to the connected production branch will trigger Vercel deployments.

## Prototype boundary

No live Plaid, Bank of America, Bridge, Privy, Stripe, debit-card, SMS, Apple/iPhone wallet, or Android wallet transaction occurs. The flows are interactive simulations for product and BRD review.


## BRD architecture update

- GFT Wallet is the **Power Wallet** and system of record.
- Wallet mapping and operations use **GFT user_id only**. Shopper phone numbers stay in the GFT UX / identity layer and are not used as the Privy wallet identifier.
- Privy is an embedded **Stripe integration/support layer**, not the primary wallet.
- LEGEND orchestrates downstream rules and workflow execution.
- Stripe executes the selected settlement / payout product after GFT defines the state.
- The BRD onboarding statement is: “All of this will take place in a clean, AI autonomous actions, structured data handling, RAG (Retrieval-Augmented Generation), MCP and agents using loops and dynamic workflows.”
