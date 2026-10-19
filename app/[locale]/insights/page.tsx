import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllPosts } from "@/lib/blog";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/insights">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "insights.meta" });
  return pageMetadata({ locale, path: "/insights", title: t("title"), description: t("description") });
}

export default async function InsightsPage({ params }: PageProps<"/[locale]/insights">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("insights");
  const format = await getFormatter();
  const posts = await getAllPosts(locale);

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} subtitle={t("hero.subtitle")} />
      <Section>
        {posts.length === 0 ? (
          <p className="text-muted">{t("empty")}</p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <li key={post.slug}>
                <article className="group relative flex h-full flex-col rounded-card border border-line bg-surface p-7 transition hover:border-primary/60">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                  <h2 className="font-display mt-5 text-2xl font-semibold text-ink" lang={post.contentLocale}>
                    <Link href={`/insights/${post.slug}`} className="after:absolute after:inset-0 after:rounded-card">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-3 flex-1 text-muted" lang={post.contentLocale}>
                    {post.description}
                  </p>
                  <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                    <time dateTime={post.date}>{format.dateTime(new Date(post.date), "long")}</time>
                    <span aria-hidden="true">·</span>
                    <span>{t("readingTime", { minutes: post.readingMinutes })}</span>
                    <Icon name="arrowRight" size={16} className="ms-auto text-primary transition-transform group-hover:translate-x-1 rtl:-scale-x-100" />
                  </p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
