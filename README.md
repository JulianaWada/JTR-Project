# Jules TechRight website

The official website of Jules TechRight (JTR) Ltd: websites, mobile apps, agentic AI, EdTech and digital transformation for clients worldwide.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4, next-intl and Motion. It is available in English, French, Arabic (right-to-left) and Portuguese, has an AI assistant powered by Claude, and sends enquiries by email through Resend.

- [Run it locally](#run-it-locally)
- [Environment variables](#environment-variables)
- [Editing content](#editing-content)
- [Translations](#translations)
- [Blog posts](#blog-posts)
- [The JTR Assistant](#the-jtr-assistant)
- [Leads and email](#leads-and-email)
- [Privacy, cookies and analytics](#privacy-cookies-and-analytics)
- [Deploying to Vercel](#deploying-to-vercel)
- [Placeholders to replace before launch](#placeholders-to-replace-before-launch)
- [Project structure](#project-structure)

## Run it locally

You need Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in the keys (see below)
npm run dev                  # http://localhost:3000
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build. It should finish with no errors or warnings. |
| `npm start` | Serves the production build on http://localhost:3000. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Generates Next.js route types and runs the TypeScript compiler. |

The site works without any keys: the assistant shows a friendly "unavailable" message and enquiries are printed in the terminal instead of emailed.

## Environment variables

Put these in `.env.local` for local work, and in Vercel under **Settings → Environment Variables** for production. Only `NEXT_PUBLIC_SITE_URL` is ever visible in the browser.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Once the domain is live | The public address, e.g. `https://www.julestechright.com`. Used for canonical links, hreflang, the sitemap, Open Graph and JSON-LD. On Vercel it falls back to the project's production address (e.g. `jtr-project.vercel.app`) until you set it. |
| `ANTHROPIC_API_KEY` | For the assistant | Claude API key from https://console.anthropic.com. Server-side only. |
| `RESEND_API_KEY` | Yes in production | Resend API key from https://resend.com. Server-side only. |
| `LEADS_TO_EMAIL` | Recommended | Inbox that receives enquiries. Defaults to `siteConfig.contact.email`. |
| `LEADS_FROM_EMAIL` | Recommended | Sender, e.g. `JTR Website <website@julestechright.com>`. Must be on a domain you have verified in Resend. |
| `DATABASE_URL` | Recommended | Postgres (e.g. Supabase) for leads, Academy sign-ups and project settings. Without it a built-in test database is used, which Vercel wipes now and then. See [Admin board](#admin-board). |
| `ADMIN_EMAIL` | Optional | Email address for the admin login. When set, `/admin` asks for it as well as the password. |
| `ADMIN_PASSWORD` | For `/admin` | Password for the admin board. Locally `demo1234` is used when it is empty; in production `/admin` stays closed until it is set. |
| `ACADEMY_DATABASE_URL` | Optional | Read access to JTR Academy's database for the admin board. Until it is set, the board says the academy is not connected. |
| `WHATSAPP_AGENT_DATABASE_URL` | Optional | The WhatsApp sales agent's database, for the admin board's business list and "Add a business". Until it is set, the board says the academy is not connected. |
| `WHATSAPP_AGENT_URL` | Optional | The sales agent's address, shown as the owners' sign-in link. |

## Editing content

Content is split in two so that every language stays in sync:

- **Words visitors read** live in `messages/<locale>.json` (`en`, `fr`, `ar`, `pt`). Headings, paragraphs, button labels, service descriptions, project text, form labels and error messages are all there.
- **Facts and structure** live in `content/site.ts`: company details, contact details, booking link, social links, which services and regions exist, project list (service, region, year, featured), reach figures, time zones, budget ranges and currencies.

Common edits:

| To change | Edit |
| --- | --- |
| Email, phone, WhatsApp, address | `siteConfig` in `content/site.ts` |
| Booking link (Cal.com) | `siteConfig.bookingUrl` |
| Map on the contact page | `siteConfig.mapEmbedUrl` (a Google Maps embed URL; a styled placeholder shows while it is empty) |
| Social links | `siteConfig.social` |
| Reach figures (countries, time zones…) | `reachFigures` in `content/site.ts` |
| Show, hide, reorder or mark a project live | The admin board, `/admin/projects` |
| Add a project | Add an entry to `projects` in `content/site.ts` (status `live` or `in-progress`, optional screenshot in `public/projects/` and public link), then add `projects.items.<id>.title`, `.summary` and `.imageAlt` in every `messages/*.json` |
| Team section | Removed for now (2026-10-30). To bring it back, restore it from git history (`about` page, `team` in `content/site.ts`, `about.team` in messages) |
| Service descriptions | `services.<id>` in the messages files |
| Logo | `public/brand/jtr-emblem.png` (header, footer, JSON-LD) and `app/icon.png` / `app/apple-icon.png` (browser icons). A vector version can go in `public/brand/jtr-emblem.svg`; see `components/brand/Logo.tsx`. |
| Colours | CSS variables at the top of `app/globals.css` (light and dark sets) |

When you add or rename a key in `messages/en.json`, do the same in the other three files. A missing key shows up as the key's name on the page and as an error in the server log.

## Translations

- English is the source language. French, Arabic and Portuguese were machine-drafted and **need review by native speakers before launch**. Each of those files starts with a `"_review"` note; delete it once the file has been reviewed.
- Arabic pages are rendered right-to-left (`dir="rtl"`). Layouts use logical properties (`start`/`end`), so new components should use `ms-`, `me-`, `ps-`, `pe-`, `start-` and `end-` instead of left/right.
- To add a language: add its code to `locales` in `i18n/routing.ts` (and to `rtlLocales` if it is right-to-left), add its name to `localeNames`, copy `messages/en.json` to `messages/<code>.json` and translate it, then add translated blog posts and legal pages if you have them.
- Visitors always land on the language in the URL. If their browser prefers another supported language, a small banner offers to switch; it never redirects on its own.

## Blog posts

Posts are MDX files in `content/blog/`:

- `my-post.mdx` is the English version and defines the URL (`/en/insights/my-post`).
- `my-post.fr.mdx`, `my-post.ar.mdx`, `my-post.pt.mdx` are optional translations. A language without its own file shows the English post.

Front matter:

```mdx
---
title: "Post title"
description: "One or two sentences for the listing card and search results."
date: "2026-10-01"
author: "JTR Team"
tags: ["Agentic AI", "Automation"]
---

Post body in Markdown…
```

Posts are listed newest first. Pages are generated at build time, so redeploy (or push to the repository) to publish a new post.

## The JTR Assistant

A floating chat button on every page and a full page at `/assistant`.

- Server route: `app/api/chat/route.ts`. It calls Claude (`claude-sonnet-5-5`) with streaming through the official `@anthropic-ai/sdk`. The API key is read on the server only.
- What it knows: `lib/assistant/prompt.ts` builds the system prompt from the English site copy (services, values, reach, careers, contact). It is told to answer only from that content, never to invent prices, timelines or clients, to reply in the visitor's language, and to offer to pass the conversation to the team.
- Lead capture: when a visitor wants to be contacted, the assistant collects their name, email and a short project summary and calls the `save_lead` tool (`lib/assistant/tools.ts`), which sends the same email as the contact form.
- Limits: 10 messages per minute and 150 per day per IP, 1,000 characters per message, and the last 20 turns of history. Change them at the top of the route and in `lib/assistant/config.ts`.
- If the key is missing, the API is down or a limit is hit, the visitor sees a short message pointing to the contact form and email.
- Server-side fallback is switched on, so if a request is declined by a safety classifier Anthropic retries it on a fallback model automatically.

The rate limiter (`lib/rate-limit.ts`) keeps counts in memory, which is enough for a single server and softer on Vercel's serverless functions (each instance has its own counts). For strict limits across instances, swap it for a shared store such as Upstash Redis (`@upstash/ratelimit`); the function signature is small on purpose.

## Leads and email

- The contact form and the assistant both end up in `saveLead()` in `lib/leads/handler.ts`, which validates the data with zod (`lib/leads/schema.ts`), drops spam caught by the hidden honeypot field, saves the lead to the database (it shows up in `/admin/leads`) and emails the team with the visitor as reply-to. Once the lead is saved, a failed email no longer fails the form. The Academy interest form works the same way (`lib/academy/interest-handler.ts`).
- The form posts to `app/api/leads/route.ts` (5 submissions per 10 minutes per IP).
- Email goes through a small provider interface in `lib/email/`. Resend is used when `RESEND_API_KEY` is set; otherwise, in development, leads are printed to the terminal. To use another service (Postmark, SES, SendGrid…), add a file next to `lib/email/resend.ts` that implements `EmailProvider` and return it from `getEmailProvider()` in `lib/email/index.ts`.
- Budget ranges are stored in US dollars and converted roughly for display when a visitor picks another currency (`approxUsdRates` in `content/site.ts`). The email states the range and currency the visitor chose.

## Admin board

`/admin` is Jules's dashboard for the whole of JTR. It is in English only, outside the language routes, and hidden from search engines. Sign in with `ADMIN_EMAIL` (if set) and `ADMIN_PASSWORD` (locally: `demo1234`).

| Page | What it shows | Where the data comes from |
| --- | --- | --- |
| Overview | New leads, Academy sign-ups, students, payments and WhatsApp businesses at a glance | All of the below |
| Leads | Contact-form and assistant enquiries; mark them new, contacted or done; download as CSV | `leads` table in this site's database |
| Academy | Courses, intakes, students and payments, with links into the academy's teacher pages for editing | The academy's database (`ACADEMY_DATABASE_URL`), read only |
| Academy → Sign-ups | Interest-form registrations from `/academy/interest`, by course; mark them contacted; CSV for WhatsApp broadcast lists | `academy_interest` table in this site's database |
| WhatsApp agent | Every business with customers, orders, bookings and payments; **Add a business** creates the business and the owner's dashboard login | The sales agent's database (`WHATSAPP_AGENT_DATABASE_URL`) |
| Projects | Show or hide each project, choose which are on the home page, set live / in progress, change the link and the order | `project_settings` table; the projects themselves and their text in four languages stay in `content/site.ts` and `messages/*.json` |

Without `ACADEMY_DATABASE_URL` or `WHATSAPP_AGENT_DATABASE_URL` those pages say the app is not connected yet. The board never shows made-up data. The admin board only reads the academy's tables and never changes them; with the sales agent it reads, and inserts new rows into `tenants` when you add a business. Each app keeps its own schema and migrations.

**Database.** Migrations in `drizzle/` run automatically on the first connection (`lib/db/index.ts`), using their own migrations table, so the website can share a database with the academy. After changing `lib/db/schema.ts`, run `npx drizzle-kit generate`. Without `DATABASE_URL` the site uses PGlite in `.data/pglite` (on Vercel, `/tmp`, which is reset from time to time, so set `DATABASE_URL` before relying on it).

**Login.** One email (optional) and password, checked on the server and kept in a signed, HTTP-only cookie limited to `/admin` for 12 hours. Changing `ADMIN_PASSWORD` signs out every session. After 8 wrong passwords from one address, logins pause for 15 minutes.

**Projects.** The public projects page and the home page refresh at most a minute after a change (straight away on the server that saved it).

## Privacy, cookies and analytics

- Only essential storage is used by default (theme, language choice, consent choice and the current chat in the browser tab).
- Vercel Web Analytics loads only after a visitor clicks **Accept analytics** in the cookie banner. They can change their mind from **Cookie settings** in the footer.
- The privacy policy and terms are MDX files in `content/legal/` (one per language). They are drafts written with the GDPR and Nigeria's NDPA in mind and **must be reviewed by a lawyer** before launch.

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project**, import the repository and keep the detected Next.js settings.
3. Add the environment variables listed above for the Production (and Preview, if you like) environment.
4. Deploy. Every push to the main branch redeploys; pull requests get preview links.
5. Add your domain under **Settings → Domains** and set `NEXT_PUBLIC_SITE_URL` to it, then redeploy so canonical links and the sitemap use it.
6. In Resend, verify the sending domain (DNS records) and set `LEADS_FROM_EMAIL` to an address on it.
7. Turn on **Web Analytics** in the Vercel project if you want analytics (it still only loads after consent).
8. Submit `https://<your-domain>/sitemap.xml` in Google Search Console.

## Placeholders to replace before launch

Search the code for `TODO` to find each one.

**Company and contact (`content/site.ts`)**

- [ ] Production domain (`siteConfig.url`, or set `NEXT_PUBLIC_SITE_URL`)
- [ ] Office street address and postal code (`siteConfig.headquarters`)
- [ ] Contact email, phone and WhatsApp number (`siteConfig.contact`)
- [ ] Careers inbox (`siteConfig.contact.careersEmail`)
- [ ] Cal.com booking link (`siteConfig.bookingUrl`)
- [ ] Google Maps embed URL for the Lagos office (`siteConfig.mapEmbedUrl`)
- [ ] Social profile URLs, or remove the ones you don't use (`siteConfig.social`)

**Portfolio, team and figures**

- [ ] Reach figures: countries, time zones, response time (`reachFigures`)
- [ ] Approximate exchange rates for budget display (`approxUsdRates`)

**Brand**

- [ ] Vector logo (`public/brand/jtr-emblem.svg`, see `components/brand/Logo.tsx`). The current PNG emblem had "LTD" removed from the original artwork.

**Email**

- [ ] `LEADS_TO_EMAIL`: the inbox that receives enquiries
- [ ] `LEADS_FROM_EMAIL`: a sender on a domain verified in Resend

**Legal (`content/legal/`, every language)**

- [ ] Lawyer review of the privacy policy and terms
- [ ] Privacy contact email and data retention period (privacy policy)
- [ ] Governing law, jurisdiction and legal contact email (terms)

**Translations**

- [ ] Native-speaker review of `messages/fr.json`, `ar.json` and `pt.json`, the translated blog posts and legal pages; then remove the `"_review"` notes

## Project structure

```text
app/
  [locale]/            Pages for each language (home, about, services, projects,
                       insights, careers, contact, assistant, privacy, terms, 404)
  api/chat/            JTR Assistant (Claude, streaming)
  api/leads/           Contact form endpoint
  sitemap.ts robots.ts Search engine files
  globals.css          Colour tokens, fonts and base styles
components/            UI, layout, page sections, forms, assistant, visuals
content/
  site.ts              Facts, links and placeholder data
  blog/                Insights posts (MDX)
  legal/               Privacy policy and terms (MDX)
i18n/                  Locales, routing and message loading (next-intl)
lib/                   SEO helpers, blog loader, leads, email providers, rate limiting, assistant
messages/              All visible copy, one JSON file per language
proxy.ts               Adds the language prefix to URLs
public/                Logo and self-hosted Arabic fonts
```
