import { BadgeIcon } from "@/components/badge-icon";
import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { currencyFor, visitorCountry } from "@/lib/location";
import { BADGES, BADGE_ORDER } from "@/lib/badges";
import { publishedCourses } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** The home page text follows which kinds of course are on sale, so hiding the live course (or bringing it back) needs no copy change. */
function steps(hasLive: boolean, hasVideo: boolean) {
  const join = !hasLive
    ? { title: "Watch your lessons", body: "Watch each video lesson whenever it suits you, on your phone or laptop, and pick up where you left off." }
    : !hasVideo
      ? {
          title: "Join your classes",
          body: "Classes with our skilled teachers in the JTR online class room, weekly or on consecutive days, with a reminder the day before.",
        }
      : {
          title: "Watch or join your classes",
          body: "Video courses: watch each lesson whenever it suits you. Live courses: classes with our skilled teachers in the JTR online class room, weekly or on consecutive days, with a reminder the day before.",
        };
  return [
    { title: "Choose a course and pay", body: "Pick a course and pay securely with Paystack: card, bank transfer or USSD." },
    join,
    {
      title: "Practise with your AI tutor",
      body: hasLive
        ? "Notes, recordings, assignments and quizzes after every class, plus an AI tutor that knows the course and answers any time."
        : "Notes, assignments and quizzes with every lesson, plus an AI tutor that knows the course and answers any time.",
    },
    { title: "Earn badges and your certificate", body: "Collect badges as you go. Finish the course and get a certificate anyone can verify online." },
  ];
}

function faqs(hasLive: boolean, hasVideo: boolean, hasAnimation: boolean, count: number) {
  return [
    {
      q: "Do I need any technical background?",
      a: `No. If you can use WhatsApp and a web browser, you can follow ${count === 1 ? "the course" : count === 2 ? "both courses" : "our courses"}. Everything is shown step by step.`,
    },
    ...(hasLive && hasVideo
      ? [
          {
            q: "What's the difference between a video course and a live course?",
            a: "A video course has recorded lessons you watch at your own pace, starting any day. A live course has classes with a skilled teacher in a small group on set dates, recorded in case you miss one.",
          },
        ]
      : []),
    {
      q: "How do I get the certificate?",
      a: [
        hasVideo && "Watch every lesson of a video course",
        hasLive && `${hasVideo ? "or attend" : "Attend"} at least 80% of a live course's classes`,
      ]
        .filter(Boolean)
        .join(", ")
        .concat(", and pass the final project. Your certificate is issued automatically, as a PDF with a link anyone can use to check it."),
    },
    { q: "How do I pay?", a: "Online with Paystack, by card, bank transfer or USSD, in naira. You get a receipt by email and access straight away." },
    {
      q: hasLive ? "What do I need for the classes?" : "What do I need for the lessons?",
      a: `A phone or laptop with internet.${hasAnimation ? " A laptop is best for the animation course." : ""}`,
    },
  ];
}

export default async function AcademyHome() {
  const courses = await publishedCourses(await getDb());
  const country = await visitorCountry();
  const hasLive = courses.some((c) => c.format === "live");
  const hasVideo = courses.some((c) => c.format === "recorded");
  const hasAnimation = courses.some((c) => c.slug === "animation-videos-with-ai");
  const hasAgents = courses.some((c) => c.slug === "ai-agents-without-code");
  const video = courses.find((c) => c.format === "recorded");
  const videoPart = hasAgents
    ? "grow your sales with AI or build your own AI assistant for WhatsApp and Instagram, in video courses you take at your own pace"
    : "grow your sales with AI in a video course you take at your own pace";
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="glow pointer-events-none absolute -top-40 right-0 size-[36rem] [--glow:22%]" />
        <div className="relative mx-auto grid max-w-site items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:py-24">
          <div>
            <p className="eyebrow">JTR Academy · Online AI courses</p>
            <h1 className="mt-4 font-display text-4xl leading-tight font-semibold text-balance text-ink sm:text-5xl">
              Learn practical AI skills from skilled teachers.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              {hasAnimation
                ? `For business owners and creators: ${videoPart}, or make animated videos with AI in a five-day live class. An AI tutor between lessons, and a certificate at the end.`
                : `For business owners and creators: ${videoPart}, starting any day. An AI tutor between lessons, and a certificate at the end.`}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#courses" className="btn-primary h-12 px-7 text-base">
                See the courses
              </Link>
              <Link href="#how-it-works" className="btn-secondary h-12 px-7 text-base">
                How it works
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
              <div>
                <dt className="text-xs text-muted">Format</dt>
                <dd className="mt-1 font-display font-semibold text-ink">{hasLive && hasVideo ? "Video + live" : hasLive ? "Live classes" : "Video lessons"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Length</dt>
                <dd className="mt-1 font-display font-semibold text-ink">{video ? `${video.outline.length} lessons` : "6 lessons"}</dd>
              </div>
              {hasLive ? (
                <div>
                  <dt className="text-xs text-muted">Live class size</dt>
                  <dd className="mt-1 font-display font-semibold text-ink">Up to 30</dd>
                </div>
              ) : (
                <div>
                  <dt className="text-xs text-muted">Start</dt>
                  <dd className="mt-1 font-display font-semibold text-ink">Any day</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="card relative">
            <p className="text-sm font-semibold text-ink">What you earn along the way</p>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {BADGE_ORDER.slice(0, 6).map((key) => (
                <li key={key} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                  <BadgeIcon badge={key} className="size-9" />
                  <span className="text-sm leading-tight font-medium text-ink">{BADGES[key].name}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft p-4">
              <BadgeIcon badge="certificate" className="size-11" />
              <div>
                <p className="font-semibold text-ink">Certificate of completion</p>
                <p className="text-sm text-muted">With a verification link for employers and clients.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="courses" className="mx-auto max-w-site scroll-mt-20 px-4 py-16 sm:px-6">
        <p className="eyebrow">Courses</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">{courses.length === 1 ? "Start with our first course" : courses.length === 2 ? "Start with one of our first two courses" : "Choose a course"}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} nextCohort={course.nextCohort} currency={currencyFor(country, course)} teacher={course.teacher} />
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-surface">
        <div className="mx-auto max-w-site px-4 py-16 sm:px-6">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">From sign-up to certificate</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps(hasLive, hasVideo).map((step, i) => (
              <li key={step.title} className="rounded-card border border-line bg-bg p-6">
                <span className="grid size-9 place-items-center rounded-full bg-primary font-display font-semibold text-primary-ink">{i + 1}</span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-site px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Questions</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Good to know</h2>
            <p className="mt-3 text-muted">
              Anything else? <a href={`${env.websiteUrl}/contact`} className="font-medium text-primary hover:underline">Contact JTR</a>.
            </p>
          </div>
          <div className="divide-y divide-line rounded-card border border-line bg-surface">
            {faqs(hasLive, hasVideo, hasAnimation, courses.length).map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer list-none font-medium text-ink marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <span className="text-muted transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
