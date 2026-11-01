# JTR domains and subdomains

Every JTR site gets its own address on one domain. This guide uses **julestechright.com**; if you use a different domain, swap it in everywhere.

| Address | What it shows | Vercel project |
| --- | --- | --- |
| `www.julestechright.com` (and `julestechright.com`, which redirects to www) | The JTR website | `jtr-project` |
| `admin.julestechright.com` | The admin board | `jtr-project` (same app, its `/admin` pages) |
| `academy.julestechright.com` | JTR Academy | `academy` |
| `agent.julestechright.com` (later) | The WhatsApp sales agent | its own project, once it is deployed |

How it works: in Vercel you add each address to the right project. Vercel then shows you one DNS record per address. You copy that record into the DNS settings at the company where you bought the domain. Vercel issues the HTTPS certificate on its own. Records usually start working within minutes, sometimes up to a few hours.

> **Tip.** Copy the exact record values Vercel shows on the Domains page. The values below (`76.76.21.21` and `cname.vercel-dns.com`) are Vercel's standard ones, but Vercel sometimes shows a project-specific value instead, and that is the one to use.

## Before you start

You need the domain bought and access to its DNS settings (at your registrar, such as Namecheap, GoDaddy, Cloudflare or Whogohost). Look for "DNS", "Manage DNS" or "Advanced DNS".

If the registrar already has a parking record for `@` or `www`, delete it, otherwise it clashes with the new ones.

## 1. Main website: julestechright.com and www

In Vercel, open the **jtr-project** project.

1. Go to **Settings → Domains**, type `julestechright.com` and click **Add**.
2. When Vercel asks, choose the recommended option: add `www.julestechright.com` too and **redirect `julestechright.com` to `www.julestechright.com`**.
3. At your registrar, add the two records Vercel shows:

   | Type | Name / Host | Value |
   | --- | --- | --- |
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

4. In **Settings → Environment Variables** set `NEXT_PUBLIC_SITE_URL` = `https://www.julestechright.com`.
5. Redeploy (Deployments → the latest one → **⋯ → Redeploy**).

## 2. Admin board: admin.julestechright.com

Still in the **jtr-project** project:

1. **Settings → Domains**, add `admin.julestechright.com` (no redirect).
2. At your registrar:

   | Type | Name / Host | Value |
   | --- | --- | --- |
   | CNAME | `admin` | `cname.vercel-dns.com` |

3. **Settings → Environment Variables**, set `ADMIN_HOST` = `admin.julestechright.com` (just the address, no `https://`).
4. Redeploy.

Now `admin.julestechright.com` opens the admin board (the address bar shows `/admin` after it). Anyone who goes to `www.julestechright.com/admin` is sent to the admin subdomain. You need to log in again once, because the login belongs to the address.

## 3. JTR Academy: academy.julestechright.com

In Vercel, open the **academy** project.

1. **Settings → Domains**, add `academy.julestechright.com`.
2. At your registrar:

   | Type | Name / Host | Value |
   | --- | --- | --- |
   | CNAME | `academy` | `cname.vercel-dns.com` |

3. In the **academy** project, **Settings → Environment Variables**:
   - `APP_URL` = `https://academy.julestechright.com` (used in emails, payment links and certificates)
   - `WEBSITE_URL` = `https://www.julestechright.com` (the "back to JTR" links)
4. Redeploy the **academy** project.
5. In the **jtr-project** project, set `ACADEMY_PUBLIC_URL` = `https://academy.julestechright.com`, and remove `ACADEMY_URL` if you set it earlier. Redeploy **jtr-project**. The website's Academy link now goes to the subdomain, and old `/academy` links redirect there. The register-interest page on the invite cards (`/academy/interest`) stays on the website, so the printed QR codes keep working.
6. In **Paystack → Settings → API Keys & Webhooks**, change the webhook URL to `https://academy.julestechright.com/academy/api/paystack/webhook`.

Students land on `academy.julestechright.com/academy`. The `/academy` part stays because the academy is built to also run inside the website.

## 4. WhatsApp sales agent: agent.julestechright.com (once it is deployed)

When the agent has its own Vercel project (Root Directory `whatsapp-agent`, see `whatsapp-agent/README.md`):

1. In that project, **Settings → Domains**, add `agent.julestechright.com`.
2. At your registrar:

   | Type | Name / Host | Value |
   | --- | --- | --- |
   | CNAME | `agent` | `cname.vercel-dns.com` |

3. In the agent project, set `APP_URL` = `https://agent.julestechright.com`, then redeploy.
4. In the **jtr-project** project, set `WHATSAPP_AGENT_URL` = `https://agent.julestechright.com`, then redeploy.
5. Update the webhook URLs: Meta (WhatsApp → Configuration) to `https://agent.julestechright.com/api/whatsapp/webhook`, and Paystack to `https://agent.julestechright.com/api/paystack/webhook`.

## Emails on the domain

Website and academy emails come from addresses on julestechright.com. In Resend, add the domain and copy the DNS records it shows (TXT and MX) into the registrar too. These do not clash with the records above.

## Checking it worked

- In Vercel, each domain on the Domains page shows **Valid Configuration** with a green tick.
- Open each address in a private browser window: the site loads with a padlock.
- If Vercel still says "Invalid Configuration" after an hour, check for a typo in the record name, and that there is no older record with the same name.
