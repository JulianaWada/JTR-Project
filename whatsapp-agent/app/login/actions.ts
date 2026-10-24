"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { endSession, startSession } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { verifyPassword } from "@/lib/passwords";

export async function login(_prev: { error?: string } | undefined, form: FormData) {
  const slug = String(form.get("business") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const db = await getDb();
  const tenant = await db.query.tenants.findFirst({ where: eq(schema.tenants.slug, slug) });
  if (!tenant || !verifyPassword(password, tenant.dashboardPasswordHash)) {
    return { error: "That business ID and password don't match." };
  }
  await startSession(tenant.id);
  redirect("/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/login");
}
