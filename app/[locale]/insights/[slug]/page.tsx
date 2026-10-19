import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getAllSlugs, getPost } from "@/lib/blog";
import { localeUrl, pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { CTABand } from "@/components/sections/CTABand";
import { mdxComponents } from "@/components/sections/MdxComponents";

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/insights/[slug]">) {
  const { locale, slug } = await params;
  const post = await getPost(slug, locale);
  if (!post) return {};
  return pageMetadata({ locale, path: `/insights/${slug}`, title: post.title, description: post.description, type: "article" });
}

export default async function ArticlePage({ params }: PageProps<"/[locale]/insights/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await getPost(slug, locale);
  if (!post) notFound();
  const t = await getTranslations("insights");
  const format = await getFormatter();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: post.contentLocale,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: siteConfig.legalName, url: siteConfig.url },
    mainEntityOfPage: localeUrl(locale, `/insights/${slug}`),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <article>
        <header className="border-b border-line">
          <Container className="max-w-3xl py-14 sm:py-20">
            <Link href="/insights" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <Icon name="arrowRight" size={16} className="rotate-180 rtl:rotate-0" />
              {t("back")}
            </Link>
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <h1 className="font-display text-balance mt-5 text-4xl font-semibold tracking-tight text-ink sm:text-5xl" lang={post.contentLocale}>
              {post.title}
            </h1>
            <p className="mt-5 text-lg text-muted" lang={post.contentLocale}>
              {post.description}
            </p>
            <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>{t("by", { author: post.author })}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.date}>{t("publishedOn", { date: format.dateTime(new Date(post.date), "long") })}</time>
              <span aria-hidden="true">·</span>
              <span>{t("readingTime", { minutes: post.readingMinutes })}</span>
            </p>
            {post.contentLocale !== locale && (
              <p className="mt-6 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted">{t("notTranslated")}</p>
            )}
          </Container>
        </header>
        <Container className="max-w-3xl py-12 sm:py-16">
          <div className="prose-jtr text-lg" lang={post.contentLocale} dir={post.contentLocale === "ar" ? "rtl" : "ltr"}>
            <MDXRemote source={post.content} components={mdxComponents} />
          </div>
        </Container>
      </article>
      <CTABand />
    </>
  );
}
