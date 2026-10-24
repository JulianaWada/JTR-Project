# JTR WhatsApp Agent

An AI sales assistant for small businesses on WhatsApp, built by Jules TechRight (JTR). It answers customers' questions, takes bookings and food orders, sends Paystack payment links, sends reminders, and hands the chat to a person when it should. It replies in English and Nigerian Pidgin. Each business owner gets a simple dashboard.

This folder is its own Next.js app, separate from the JTR website at the repository root.

## What works today

Everything runs **without any accounts or keys**. Each outside service has a test mode that switches on automatically when its key is missing:

| Service | Without a key (test mode) | With a key (live) |
| --- | --- | --- |
| Claude (AI) | A simple offline "demo brain" that understands a few phrasings in English and Pidgin and uses the same tools | Claude (`claude-sonnet-5-5`, the same model as the website assistant) |
| WhatsApp | Nothing is sent; messages are recorded for the dashboard | Meta WhatsApp Cloud API |
| Paystack | Payment links open a test checkout page with a "Pay (test)" button | Real Paystack checkout |
| Database | Embedded Postgres (PGlite) in `.data/` | Postgres, e.g. Supabase |

Two demo businesses are created on first start: **Glow Up Studio** (a salon in Wuse 2, bookings with a 30% deposit) and **Mama Nkechi's Kitchen** (a food vendor in Garki, delivery and pickup). Their prices are made up for demos.

### Features

- **Answers questions** only from the business's own details (hours, address, prices, policies). Anything else is handed to a person.
- **Bookings**: checks free times against opening hours and how many customers can be served at once, holds the slot, and asks for a deposit if the business wants one. Unpaid holds are released after an hour.
- **Orders**: menu items and quantities, delivery or pickup, delivery fee, total. Orders are only prepared once paid.
- **Payments**: Paystack payment link sent as its own message; confirmed by Paystack's webhook (double-checked with Paystack's API), then the customer gets a confirmation and the owner an alert.
- **Reminders**: the day before and two hours before an appointment, a nudge for unpaid orders, and releasing unpaid bookings. Uses WhatsApp templates when the customer hasn't written in 24 hours.
- **Hand-over**: the agent passes the chat to a person when asked, when a customer complains or wants a refund or discount, or when it can't answer. Customers can also type HUMAN. The owner is alerted on WhatsApp and replies from the dashboard; "Hand back to AI" returns control.
- **Owner dashboard**: overview, chats (with take over / hand back / reply), orders (status changes message the customer), bookings, payments, business details and menu editor, and a **"Try the agent"** WhatsApp simulator for demos.
- **Privacy (NDPA)**: the first reply tells customers they're talking to an AI and links to a privacy notice; STOP / START turn reminders off and on; chats older than 12 months are deleted.

## Run it locally

```bash
cd whatsapp-agent
npm install
npm run dev          # http://localhost:3100
```

Sign in with business ID `glow-up-studio` or `mama-nkechi-kitchen` and password `demo1234`, then open **Try the agent**.

```bash
npm test             # 18 tests: booking, order, payment, reminder, hand-over and webhook flows
npm run lint && npm run typecheck
```

To use Claude locally, put `ANTHROPIC_API_KEY=...` in `whatsapp-agent/.env.local` and restart.

## What Jules needs to set up

Do these roughly in this order. Meta's business verification is the slowest step, so start it first.

### 1. Meta (WhatsApp Business Platform)

1. Create a **Meta Business portfolio** for Jules TechRight Ltd at business.facebook.com and start **business verification** (CAC certificate, proof of address, a company website and email on that domain). This can take days to weeks.
2. At developers.facebook.com create an app of type **Business**, and add the **WhatsApp** product. Meta gives you a free test number straight away, which is enough to build and demo.
3. Add a **spare SIM number** (one not already on WhatsApp or WhatsApp Business app) as the real demo number, and set its display name.
4. Create a **System User** in Business Settings, give it the app and the WhatsApp account, and generate a **permanent access token** with `whatsapp_business_messaging` and `whatsapp_business_management`.
5. Note these values for Vercel: the token (`WHATSAPP_ACCESS_TOKEN`), the **App secret** from App settings → Basic (`WHATSAPP_APP_SECRET`), and the **Phone number ID** of each number (entered per business, see step 6).
6. In WhatsApp → Configuration, set the webhook URL to `https://<your-agent-domain>/api/whatsapp/webhook`, the verify token to any long random string (`WHATSAPP_VERIFY_TOKEN`), and subscribe to **messages**.
7. Submit these **message templates** (category Utility, language English) for approval. They are only used when the customer hasn't written in the last 24 hours:
   - `booking_reminder`: `Hi {{1}}, a reminder of your {{2}} at {{3}} on {{4}}. Reply here if you need to change it.`
   - `order_update`: `Update on {{1}} from {{2}}: it is now {{3}}.`
   - `owner_alert`: `{{1}} needs you on WhatsApp: {{2}} Open the dashboard: {{3}}`

### 2. Paystack

1. Create a **Paystack business account** for JTR and complete compliance (CAC documents, director BVN, settlement bank account). You can use the **test keys** immediately, before approval.
2. Copy the **secret key** (`sk_test_...` first, `sk_live_...` once approved) into `PAYSTACK_SECRET_KEY`.
3. In Settings → API Keys & Webhooks, set the webhook URL to `https://<your-agent-domain>/api/paystack/webhook` (separately for test and live).
4. So each business is paid directly, create a **subaccount** for each client business in Paystack and paste its code (`ACCT_...`) into that business's record. Without a subaccount, payments settle to JTR's account.
5. Paystack needs an email for every payment; the agent uses `wa<phone>@customers.julestechright.com`. Change the domain with `PAYSTACK_PLACEHOLDER_EMAIL_DOMAIN` if you prefer.

### 3. Anthropic

Create an API key at platform.claude.com (the same key also switches on the website assistant). Set a monthly spend limit in the console. Put it in `ANTHROPIC_API_KEY`.

### 4. Database (Supabase)

Create a free Supabase project (region: closest to Nigeria, e.g. West EU / London). In Project Settings → Database, copy the **transaction pooler** connection string (port 6543) into `DATABASE_URL`. Tables are created automatically on each deploy.

### 5. Hosting (Vercel)

1. Create a **new Vercel project** from this repository with **Root Directory** set to `whatsapp-agent` (separate from the website project).
2. Add the environment variables below and deploy.
3. Point a domain at it, for example `agent.julestechright.com`, and set `APP_URL` to that address.
4. **Reminders** need `/api/cron/reminders` called every 10–15 minutes with the header `Authorization: Bearer <CRON_SECRET>`. Vercel's free plan only allows a daily cron, so either use the Pro plan with a `vercel.json` cron, or a free scheduler such as cron-job.org.

### Environment variables

| Name | What it is |
| --- | --- |
| `APP_URL` | Public address of this app, e.g. `https://agent.julestechright.com` |
| `SESSION_SECRET` | Long random string for dashboard sign-ins (required in production) |
| `DATABASE_URL` | Supabase Postgres connection string |
| `ANTHROPIC_API_KEY` | Claude API key |
| `AGENT_MODEL` | Optional; defaults to `claude-sonnet-5-5` |
| `WHATSAPP_ACCESS_TOKEN` | Permanent System User token |
| `WHATSAPP_APP_SECRET` | Meta app secret, used to verify webhooks |
| `WHATSAPP_VERIFY_TOKEN` | The string you typed when setting up the webhook |
| `WHATSAPP_GRAPH_VERSION` | Optional; defaults to `v23.0` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `CRON_SECRET` | Long random string the reminder scheduler sends |
| `DEMO_PASSWORD` | Optional in production: creates the two demo businesses with this password on first start |

### 6. Adding a real business

For now a new business is added with a short database insert (a sign-up screen is a later step): copy a demo business row in Supabase, change its name, slug, `whatsapp_phone_number_id` (from Meta), owner phone and password, then sign in and fill in **Business details** and the menu or services from the dashboard. Ask me to add an admin page for this when the first pilot is ready.

## How it is built

- `lib/agent/`: the Claude agent. `prompt.ts` (per-business system prompt), `tools.ts` (check availability, create booking/order, cancel, look up, resend payment link, hand over), `run.ts` (the loop), `mock-brain.ts` (the offline demo brain).
- The full Claude conversation is stored **append-only** (`agent_turns`) and replayed exactly, which keeps prompt caching effective and thinking blocks valid. Business details are in the cached system prompt; the time of each message is in the message itself.
- The agent never writes payment links itself; the system sends them as a separate message, so a link can't be mistyped or invented.
- `lib/inbound.ts`: incoming WhatsApp messages (duplicates ignored, STOP/START/HUMAN keywords). `lib/messaging.ts`: sending, including the 24-hour rule.
- `lib/bookings.ts`, `lib/orders.ts`, `lib/payments.ts`, `lib/reminders.ts`: business logic.
- `app/api/`: webhooks for WhatsApp and Paystack (both signature-checked) and the reminder cron.
- `app/dashboard/`: the owner dashboard.

## Not built yet (by design, see the build plan)

Voice notes and images (the agent asks customers to type instead), other languages, Instagram/Facebook chats, stock or accounting integrations, a self-service sign-up for new businesses, and refunds through Paystack (owners refund in the Paystack dashboard).

## Before launch

- Legal review of the privacy notice (`app/privacy/[slug]/page.tsx`) against the NDPA 2023, and a data processing agreement between JTR and each client business.
- Test with real customers in English and Pidgin during the pilot, and tune the prompt from what goes wrong.
- Set per-business message and AI usage limits once real costs are known.
