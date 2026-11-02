"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { startCheckout } from "@/lib/enrolment";

export async function checkout(cohortId: string, _prev: { error?: string } | undefined, form: FormData) {
  const user = await requireUser(`/enrol/${cohortId}`);
  const currency = form.get("currency") === "USD" ? "USD" : "NGN";
  const result = await startCheckout(await getDb(), user, cohortId, String(form.get("code") ?? ""), currency);
  if ("error" in result) return { error: result.error };
  redirect(result.redirectTo);
}
