import { MDXRemote } from "next-mdx-remote/rsc";
import { getFormatter, getTranslations } from "next-intl/server";
import { getLegalDoc } from "@/lib/legal";
import { PageHero } from "./PageHero";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { mdxComponents } from "./MdxComponents";

export async function LegalPage({ doc, locale }: { doc: "privacy" | "terms"; locale: string }) {
  const t = await getTranslations("legal");
  const format = await getFormatter();
  const { content, updated, contentLocale } = await getLegalDoc(doc, locale);
  return (
    <>
      <PageHero
        eyebrow={t(`${doc}.title`)}
        title={t(`${doc}.title`)}
        subtitle={t("lastUpdated", { date: format.dateTime(new Date(updated), "long") })}
      />
      <Container className="max-w-3xl py-12 sm:py-16">
        <p role="note" className="flex gap-3 rounded-xl border border-line bg-surface-2 p-4 text-sm text-ink">
          <Icon name="shield" size={20} className="shrink-0 text-primary" />
          {t("draftNotice")}
        </p>
        <div className="prose-jtr mt-8" lang={contentLocale}>
          <MDXRemote source={content} components={mdxComponents} />
        </div>
      </Container>
    </>
  );
}
