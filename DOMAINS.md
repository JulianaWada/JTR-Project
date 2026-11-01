# JTR domains and subdomains

Every JTR site gets its own address on one domain: **jtechright.com**.

| Address | What it shows | Vercel project |
| --- | --- | --- |
| `www.jtechright.com` (and `jtechright.com`, which redirects to www) | The JTR website | `jtr-project` |
| `admin.jtechright.com` | The admin board | `jtr-project` (same app, its `/admin` pages) |
| `academy.jtechright.com` | JTR Academy | `academy` |
| `agent.jtechright.com` (later) | The WhatsApp sales agent | its own project, once it is deployed |

> **jtechright.com was bought through Vercel**, so Vercel runs its DNS. Adding an address to a project is all it takes: skip every "At your registrar" step below. A newly bought domain can take 10 to 15 minutes before its addresses turn green. Make sure the domain sits in the **JTR** team (JTR → Domains); if it is under a personal account, move it there.

If the domain were ever moved to another registrar, this is how it works: in Vercel you add each address to the right project. Vercel then shows you one DNS record per address. You copy that record into the DNS settings at the company where you bought the domain. Vercel issues the HTTPS certificate on its own. Records usually start working within minutes, sometimes up to a few hours.

> **Tip.** Copy the exact record values Vercel shows on the Domains page. The values below (`76.76.21.21` and `cname.vercel-dns.com`) are Vercel's standard ones, but Vercel sometimes shows a project-specific value instead, and that is the one to use.

## Before you start

You need the domain bought and access to its DNS settings (at your registrar, such as Namecheap, GoDaddy, Cloudflare or Whogohost). Look for "DNS", "Manage DNS" or "Advanced DNS".

If the registrar already has a parking record for `@` or `www`, delete it, otherwise it clashes with the new ones.

## 1. Main website: jtechright.com and www

In Vercel, open the **jtr-project** project.

1. Go to **Settings → Domains**, type `jtechright.com` and click **Add**.
2. When Vercel asks, choose the recommended option: add `www.jtechright.com` too and **redirect `jtechright.com` to `www.jtechright.com`**.
3. At your registrar, add the two records Vercel shows:

   | Type | Name / Host | Value |
   | --- | --- | --- |
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

4. In **Settings → Environment Variables** set `NEXT_PUBLIC_SITE_URL` = `https://www.jtechright.com`.
5. Redeploy (Deployments → the latest one → **⋯ → Redeploy**).

## 2. Admin board: admin.jtechright.com

Still in the **jtr-project** project:

1. **Settings → Domains**, add `admin.jtechright.com` (no redirect).
2. At your registrar:

   | Type | Name / Host | Value |
   | --- | --- | --- |
   | CNAME | `admin` | `cname.vercel-dns.com` |

3. **Settings → Environment Variables**, set `ADMIN_HOST` = `admin.jtechright.com` (just the address, no `https://`).
4. Redeploy.

Now `admin.jtechright.com` opens the admin board (the address bar shows `/admin` after it). Anyone who goes to `www.jtechright.com/admin` is sent to the admin subdomain. You need to log in again once, because the login belongs to the address.

## 3. JTR Academy: academy.jtechright.com

In Vercel, open the **academy** project.

1. **Settings → Domains**, add `academy.jtechright.com`.
2. At your registrar:

   | Type | Name / Host | Value |
   | --- | --- | --- |
   | CNAME | `academy` | `cname.vercel-dns.com` |

3. In the **academy** project, **Settings → Environment Variables**:
   - `APP_URL` = `https://academy.jtechright.com` (used in emails, payment links and certificates)
   - `WEBSITE_URL` = `https://www.jtechright.com` (the "back to JTR" links)
4. Redeploy the **academy** project.
5. In the **jtr-project** project, set `ACADEMY_PUBLIC_URL` = `https://academy.jtechright.com`, and remove `ACADEMY_URL` if you set it earlier. Redeploy **jtr-project**. The website's Academy link now goes to the subdomain, and old `/academy` links redirect there. The register-interest page on the invite cards (`/academy/interest`) stays on the website, so the printed QR codes keep working.
6. In **Paystack → Settings → API Keys & Webhooks**, change the webhook URL to `https://academy.jtechright.com/academy/api/paystack/webhook`.

Students land on `academy.jtechright.com/academy`. The `/academy` part stays because the academy is built to also run inside the website.

## 4. WhatsApp sales agent: agent.jtechright.com (once it is deployed)

When the agent has its own Vercel project (Root Directory `whatsapp-agent`, see `whatsapp-agent/README.md`):

1. In that project, **Settings → Domains**, add `agent.jtechright.com`.
2. At your registrar:

   | Type | Name / Host | Value |
   | --- | --- | --- |
   | CNAME | `agent` | `cname.vercel-dns.com` |

3. In the agent project, set `APP_URL` = `https://agent.jtechright.com`, then redeploy.
4. In the **jtr-project** project, set `WHATSAPP_AGENT_URL` = `https://agent.jtechright.com`, then redeploy.
5. Update the webhook URLs: Meta (WhatsApp → Configuration) to `https://agent.jtechright.com/api/whatsapp/webhook`, and Paystack to `https://agent.jtechright.com/api/paystack/webhook`.

## Emails on the domain

Website and academy emails come from addresses on jtechright.com. In Resend, add the domain and copy the DNS records it shows (TXT and MX) into Vercel: JTR → Domains → jtechright.com → add each record. These do not clash with the records above.

## Checking it worked

- In Vercel, each domain on the Domains page shows **Valid Configuration** with a green tick.
- Open each address in a private browser window: the site loads with a padlock.
- If Vercel still says "Invalid Configuration" after an hour, check for a typo in the record name, and that there is no older record with the same name.
