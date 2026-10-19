import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { Container } from "@/components/ui/Container";
import { ChatPanel } from "@/components/assistant/ChatPanel";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/assistant">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "assistant.meta" });
  return pageMetadata({ locale, path: "/assistant", title: t("title"), description: t("description") });
}

export default async function AssistantPage({ params }: PageProps<"/[locale]/assistant">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("assistant");
  return (
    <>
      <PageHero eyebrow={t("name")} title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <Container className="max-w-3xl py-10 sm:py-14">
        <ChatPanel variant="page" />
      </Container>
    </>
  );
}
