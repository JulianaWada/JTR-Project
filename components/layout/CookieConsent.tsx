"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "jtr-consent";
type Choice = "accepted" | "rejected";

/**
 * Cookie banner. Analytics (Vercel Analytics) are only downloaded and started
 * after the visitor accepts. Re-opened from "Cookie settings" in the footer.
 */
export function CookieConsent() {
  const t = useTranslations("consent");
  const [choice, setChoice] = useState<Choice | null>(null);
  const [open, setOpen] = useState(false);
  const [Analytics, setAnalytics] = useState<ComponentType | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (saved === "accepted" || saved === "rejected") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stored choice is only readable on the client
      setChoice(saved);
    } else {
      setOpen(true);
    }
    const reopen = () => setOpen(true);
    window.addEventListener("jtr:open-consent", reopen);
    return () => window.removeEventListener("jtr:open-consent", reopen);
  }, []);

  useEffect(() => {
    if (choice !== "accepted" || Analytics) return;
    import("@vercel/analytics/next").then((m) => setAnalytics(() => m.Analytics));
  }, [choice, Analytics]);

  const decide = (c: Choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
    setChoice(c);
    setOpen(false);
    // Turning analytics off after it was on needs a reload to unload the script.
    if (c === "rejected" && Analytics) window.location.reload();
  };

  return (
    <>
      {Analytics && <Analytics />}
      {open && (
        <div
          role="region"
          aria-label={t("title")}
          className="fixed inset-x-3 bottom-3 z-[55] mx-auto max-w-xl rounded-card border border-line bg-surface p-5 shadow-2xl shadow-black/20 sm:bottom-5 sm:p-6"
        >
          <h2 className="font-display text-base font-semibold text-ink">{t("title")}</h2>
          <p className="mt-2 text-sm text-muted">
            {t("body")}{" "}
            <Link href="/privacy" className="font-medium text-primary underline underline-offset-2">
              {t("policy")}
            </Link>
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => decide("rejected")}>
              {t("reject")}
            </Button>
            <Button onClick={() => decide("accepted")}>{t("accept")}</Button>
          </div>
        </div>
      )}
    </>
  );
}
