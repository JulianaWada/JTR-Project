# JTR Academy

The online school on the JTR website: paid courses taught by Jules, with lesson notes, assignments, quizzes, an AI tutor (Claude), badges and verifiable certificates. It starts with two courses: **Boost Sales with AI**, a recorded video course students take at their own pace, and **Create Animation Videos with AI**, six weeks of live classes.

**Two formats** (set per course in the teacher dashboard): *live* courses run in dated intakes with weekly Google Meet classes; *recorded* courses have one always-open self-paced intake whose lessons are videos (paste a YouTube unlisted, Vimeo, Loom or Google Drive link and it plays inside the lesson page). Students mark each video lesson done, and the certificate needs every lesson watched plus the final project.

It is a separate Next.js app in this folder, served under `/academy` on the website's own address (Next.js [multi-zones](https://nextjs.org/docs/app/guides/multi-zones)). Visitors see one site; work on the academy can't break the website.

## What's inside

| For | Pages |
| --- | --- |
| Visitors | Academy home, course pages with intakes and seats left, certificate verification (`/academy/verify`) |
| Students | Sign up, Paystack checkout with discount codes, dashboard, class timetable with a Join button (records attendance, then opens Google Meet), lesson notes and recordings, assignments, quizzes, AI tutor, badges, certificate PDF |
| Jules (teacher) | Overview, courses (details, outline, assignments, quizzes as plain text), intakes (classes, attendance grid, issue or withdraw certificates, email everyone), marking with feedback, payments and discount codes, questions students ask the tutor, every email sent |

**Certificates** are issued automatically when a student attends at least 80% of the live classes and passes the final project (both editable per course). Each has an ID like `JTR-7K3F9` and a public page at `/academy/verify/<ID>`.

**Badges:** First class, Getting to work, Quiz ace, Halfway there, Perfect attendance, Project passed, Graduate.

## Run it locally

```bash
cd academy
npm install
npm run dev          # http://localhost:3200/academy
npm test             # 11 tests, all in test mode
```

With no keys everything runs in **test mode**: an embedded database (`.data/`), a practice checkout instead of Paystack, a tutor that quotes the lesson notes instead of calling Claude, and emails that are saved to the teacher's Emails page instead of being sent. Demo logins (password `demo1234`):

- Student in progress: `ada@example.com`
- Graduate with a certificate: `chioma@example.com` (certificate `JTR-DEMO7`)
- Teacher: `jules@julestechright.com`

Delete `academy/.data` to start again with fresh demo data.

**In production there is no sample data.** Without `DEMO_PASSWORD` the first start adds only the two courses (the recorded Sales course and one January intake of Animation, with no Meet link yet) and Jules's teacher account. Students, payments and certificates come only from real signups. Migration `0002_remove_demo_data` also clears any demo students, sample intake, demo Meet link, demo recordings and the unused `EARLYBIRD` code from a database that already had them; real signups and courses are kept.

## Going live

1. **Database (Supabase).** Create a project, then copy *Project settings > Database > Connection string > Transaction pooler* (port 6543) into `DATABASE_URL`. Tables are created automatically on every build.
2. **Vercel.** Add a new project from this repository with **Root Directory = `academy`**. Set the environment variables below. Vercel Cron sends class reminders every hour (`vercel.json`).
3. **Connect it to the website.** Recommended: give the academy its own subdomain, `academy.jtechright.com` (step-by-step in [DOMAINS.md](../DOMAINS.md)). Set `APP_URL` here to `https://academy.jtechright.com`, and in the website's Vercel project set `ACADEMY_PUBLIC_URL` to the same address. The "Academy" link then appears in the website's menu and footer and goes to the subdomain; old `/academy` links on the website redirect there. `/academy/interest` stays a website page. (Alternative: set `ACADEMY_URL` on the website instead, to serve the academy at `/academy` on the website.)
4. **Paystack.** Use your secret key, and set the webhook URL to `<APP_URL>/academy/api/paystack/webhook`, e.g. `https://academy.jtechright.com/academy/api/paystack/webhook`.
5. **Emails (Resend).** Verify the sending domain and set `RESEND_API_KEY`.

| Variable | What it's for |
| --- | --- |
| `APP_URL` | The address students use, e.g. `https://academy.jtechright.com` (used in emails, payment links and on certificates) |
| `WEBSITE_URL` | The JTR website, for "back to website" links, e.g. `https://www.jtechright.com` |
| `ALLOWED_ORIGINS` | Any other domain that forwards `/academy` here (the Vercel address and jtechright.com are already allowed) |
| `SESSION_SECRET` | A long random string; required in production |
| `DATABASE_URL` | Supabase connection string |
| `TEACHER_EMAIL`, `TEACHER_PASSWORD` | Jules's teacher login, created on first start |
| `ANTHROPIC_API_KEY`, `TUTOR_MODEL` | The AI tutor (default model `claude-sonnet-5-5`) |
| `PAYSTACK_SECRET_KEY` | Real payments |
| `RESEND_API_KEY`, `EMAIL_FROM` | Real emails |
| `CRON_SECRET` | Protects the reminders endpoint; Vercel sends it automatically |
| `DEMO_PASSWORD` | Leave empty in production (it creates the demo students) |

## Still to decide

- Course prices (₦50,000 each is a placeholder), intake dates and the Google Meet link for each intake.
- Lesson notes are a starting draft written for this build: please review and edit them in the teacher dashboard.
- The certificate is signed "Jules, Lead Instructor".
- Privacy policy and terms should mention student data and payments.
