// Central place for configuration. Every outside service has a test mode that is used
// automatically when its keys are missing, so the whole academy runs without any accounts.

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/**
 * Reads an address setting and tidies it, so a value typed as "academy.jtechright.com", with quotes or with a
 * trailing slash or path still works (only the origin is kept). An unusable value falls back instead of crashing every page.
 */
export function readOrigin(name: string, fallback: string): string {
  let value = read(name)?.replace(/^["'`\s]+|["'`\s]+$/g, "");
  if (!value) return fallback;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    console.error(`${name} is not a valid address; using ${fallback}`);
    return fallback;
  }
}

/** The academy is served under this path, on its own or behind the JTR website (see next.config.ts). */
export const BASE_PATH = "/academy";

export const env = {
  /** The public origin students see, e.g. https://jtechright.com (the website forwards /academy here). */
  get appUrl() {
    return readOrigin("APP_URL", "http://localhost:3200");
  },
  /** The JTR website, for the "Back to JTR" links. */
  get websiteUrl() {
    return readOrigin("WEBSITE_URL", "https://jtr-project.vercel.app");
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },

  // Database: Postgres in production (Supabase), embedded PGlite otherwise.
  get databaseUrl() {
    return read("DATABASE_URL");
  },
  get pgliteDir() {
    return read("PGLITE_DIR") ?? ".data/pglite";
  },

  // Claude (the AI tutor)
  get anthropicApiKey() {
    return read("ANTHROPIC_API_KEY");
  },
  get tutorModel() {
    return read("TUTOR_MODEL") ?? "claude-sonnet-5-5";
  },

  // Paystack
  get paystackSecretKey() {
    return read("PAYSTACK_SECRET_KEY");
  },

  // Email (Resend)
  get resendApiKey() {
    return read("RESEND_API_KEY");
  },
  get emailFrom() {
    return read("EMAIL_FROM") ?? "JTR Academy <academy@jtechright.com>";
  },

  // Sessions and cron
  get sessionSecret() {
    const value = read("SESSION_SECRET");
    if (value) return value;
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set in production");
    return "dev-only-session-secret-change-me";
  },
  get cronSecret() {
    return read("CRON_SECRET");
  },
  /** Password for the demo teacher and students. Never set in production unless you want demo logins. */
  get demoPassword() {
    return read("DEMO_PASSWORD") ?? (process.env.NODE_ENV === "production" ? undefined : "demo1234");
  },
};

export type ServiceMode = "live" | "test";

export function modes(): { claude: ServiceMode; paystack: ServiceMode; email: ServiceMode; database: "postgres" | "embedded" } {
  return {
    claude: env.anthropicApiKey ? "live" : "test",
    paystack: env.paystackSecretKey ? "live" : "test",
    email: env.resendApiKey ? "live" : "test",
    database: env.databaseUrl ? "postgres" : "embedded",
  };
}

/** An absolute link to an academy page, e.g. url("/verify/ABC") → https://…/academy/verify/ABC. */
export function url(path: string) {
  return `${env.appUrl}${BASE_PATH}${path}`;
}
