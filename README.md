# A Little Wish — Birthday Greeting Platform

A Nuxt 4 birthday greeting web app where visitors send greeting cards to birthday owners, with optional monetary gifts and a time-capsule (advance wish) feature.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string (Atlas or local) |
| `NUXT_SESSION_PASSWORD` | Random secret; generate 32 bytes with `openssl rand -hex 32` |
| `PAYMENT_PROVIDER` | `mock` (the only provider currently implemented) |

### 3. Run development server

```bash
npm run dev
```

### 4. Deploy to Render

1. Create a MongoDB database (for example, MongoDB Atlas) and copy its connection URI.
   Ensure the database's network access list permits connections from your Render service.
2. In Render, choose **New → Blueprint** and connect this repository. Render reads
   [`render.yaml`](./render.yaml) to create the web service.
3. When prompted, set `NUXT_MONGODB_URI` to the MongoDB connection URI. Render
   generates `NUXT_SESSION_PASSWORD` for the service.
4. Deploy. The health check uses `/`; Render supplies the port used by the Nuxt
   Node server.

The Blueprint uses the free web-service plan and the `mock` payment provider.
Free services may sleep when idle. The app currently only implements `mock`;
setting `promptpay` will fail until a real payment provider is implemented.

If configuring owner PromptPay IDs, also set `NUXT_PROMPTPAY_ENCRYPTION_KEY` in
Render to a persistent 64-character hexadecimal key. Generate it with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep this key secret and back it up securely. Changing or losing it makes
previously stored PromptPay IDs impossible to decrypt. The value is not generated
by the Blueprint because it must be hexadecimal and remain stable across deploys.

### 5. Production build

```bash
npm run build
node .output/server/index.mjs
```

---

## Routes

| Path | Description |
|---|---|
| `/` | Homepage |
| `/create` | Birthday owner creates their page |
| `/wish` | Sender enters a birthday page ID |
| `/wish/:pageId` | Sender submits a greeting card |
| `/owner/:pageId` | Owner's private view (random card draw) |
| `/my-cards` | Visitor views their own submitted cards |

---

## Architecture

### Collections (MongoDB)

- **BirthdayPage** — one per owner. Stores `displayName`, `dateOfBirth`, `ownerTokenHash`.
- **GreetingCard** — one per wish. Stores `birthdayPageId`, `senderName`, `message` (profanity-masked), `targetYear`, `visitorTokenHash`, `shuffleKey`.
- **Contribution** — one per payment attempt. Stores `status` (only updated by server-side callback), `providerRef`, `amount`.

### Server API

| Method | Path | Auth |
|---|---|---|
| `POST` | `/api/pages` | None (creates page) |
| `GET` | `/api/pages/:id` | None |
| `POST` | `/api/cards` | None (creates card) |
| `GET` | `/api/cards/:id` | Bearer visitor token |
| `GET` | `/api/pages/:id/cards/draw` | Bearer owner token |
| `GET` | `/api/payments/:id/status` | None |
| `POST` | `/api/payments/:id/mock-confirm` | None (mock only) |

### Temporary Auth (no real login yet)

Both owners and visitors receive an opaque 64-char hex token at creation time stored in `localStorage`.
It is hashed (SHA-256) before storage in MongoDB.
On protected endpoints the raw token is sent as `Authorization: Bearer <token>`.

**This is a stopgap.** Replace with real session/JWT auth before production.

### Profanity Filtering

- Server-side only (`server/utils/profanity.ts`)
- Unicode NFKC normalisation + leet-speak substitutions
- Matched words replaced with `###` before storage
- Extend `BUILTIN_BLOCKED` or point `PROFANITY_LIST_PATH` to a custom word list

### Payment

- Abstraction layer in `server/utils/payment.ts`
- Default: `mock` provider (dev QR placeholder, never auto-confirms)
- Visitors can report a transfer from the wish form. This is stored as `paid_unverified`; it is not proof that money was received.
- Owners can see whether a card has a gift and optionally reveal its amount and reported status.
- To add PromptPay: implement the `PaymentProvider` interface, register it in `getProvider()`, set `PAYMENT_PROVIDER=promptpay`

### Advance Wishes (Time Capsule)

- Cards with `targetYear > currentYear` are stored but never returned by the draw API
- Server enforces this: advance-wish content is not included in any API response until the target year
- UI shows only the count of pending advance wishes to the owner

---

## Remaining Limitations / TODOs

- [ ] Real authentication (replace localStorage token with session/JWT)
- [ ] Real payment provider (PromptPay webhook callback + signature verification)
- [ ] Rate limiting on card submission endpoint
- [ ] Email/SMS notifications to birthday owner
- [ ] Birthday page expiry / yearly reset
- [ ] Admin moderation panel
- [ ] Image/sticker attachments in cards
