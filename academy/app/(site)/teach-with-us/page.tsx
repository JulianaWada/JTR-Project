import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { ApplyForm } from "./apply-form";

export const metadata: Metadata = { title: "Teach with JTR", description: "Run your own courses on JTR Academy, with your own logo, materials, class room and AI tutor." };
export const dynamic = "force-dynamic";

const perks = [
  { title: "Your own space", body: "Your logo, photo, bio and colour on your course pages and your dashboard." },
  { title: "Everything to teach", body: "Live classes in the JTR class room or video lessons, notes, slides, files, quizzes, assignments and certificates." },
  { title: "An AI tutor for your students", body: "It answers questions from your own lesson notes, any time of day." },
  { title: "We handle payments", body: "Students pay securely with Paystack. You see every sale of your courses." },
];

export default async function TeachWithUs({ searchParams }: PageProps<"/teach-with-us">) {
  const { sent } = await searchParams;
  const user = await currentUser();
  const profile = user ? await (await getDb()).query.teacherProfiles.findFirst({ where: eq(schema.teacherProfiles.userId, user.id) }) : undefined;

  let body: React.ReactNode;
  if (user?.role === "teacher") {
    body = (
      <div className="card">
        <h2 className="font-display text-xl font-semibold text-ink">You&apos;re a teacher</h2>
        <p className="mt-2 text-sm text-muted">Your teacher dashboard is ready.</p>
        <Link href="/teach" className="btn-primary mt-4">
          Open my teacher dashboard
        </Link>
      </div>
    );
  } else if (profile?.status === "pending") {
    body = (
      <div className="card border-primary/30">
        <h2 className="font-display text-xl font-semibold text-ink">{sent ? "Thank you! Your application is in." : "Your application is waiting for approval"}</h2>
        <p className="mt-2 text-sm text-muted">
          JTR will look at it and email you at <span className="font-medium text-ink">{user?.email}</span>. Once you&apos;re approved, log in and your
          teacher dashboard opens, where you add your logo and build your courses.
        </p>
        <Link href="/learn" className="btn-secondary mt-4">
          Go to my account
        </Link>
      </div>
    );
  } else if (profile?.status === "suspended") {
    body = (
      <div className="card">
        <h2 className="font-display text-xl font-semibold text-ink">Your teacher account is suspended</h2>
        <p className="mt-2 text-sm text-muted">{profile.adminNote || "Please contact JTR if you have questions."}</p>
      </div>
    );
  } else {
    body = (
      <div className="card">
        {profile?.status === "rejected" && (
          <div className="mb-6 rounded-xl bg-warning-soft p-4 text-sm text-warning">
            Your last application wasn&apos;t approved.{profile.adminNote ? ` ${profile.adminNote}` : ""} You can update it and send it again.
          </div>
        )}
        {user && <p className="mb-5 text-sm text-muted">You&apos;re applying as {user.name} ({user.email}).</p>}
        <ApplyForm signedIn={!!user} defaults={profile ?? undefined} />
        {!user && (
          <p className="mt-6 text-sm text-muted">
            Already have a JTR Academy account?{" "}
            <Link href="/login?next=/teach-with-us" className="font-medium text-primary hover:underline">
              Log in first
            </Link>{" "}
            and apply with it.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-site gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:py-16">
      <div>
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">Teach with JTR</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-balance text-ink">Run your own courses on JTR Academy</h1>
        <p className="mt-4 text-lg text-muted">Register as a teacher. Once JTR approves you, you get your own teacher dashboard to build and run your courses.</p>
        <ul className="mt-8 space-y-4">
          {perks.map((p) => (
            <li key={p.title} className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-sm text-primary" aria-hidden>
                ✓
              </span>
              <span>
                <span className="block font-medium text-ink">{p.title}</span>
                <span className="text-sm text-muted">{p.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>{body}</div>
    </div>
  );
}
