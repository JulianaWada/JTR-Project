// Central place for configuration. Every outside service has a "mock" mode that is used
// automatically when its keys are missing, so the whole product runs without any accounts.

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export const env = {
  get appUrl() {
    return (read("APP_URL") ?? "http://localhost:3100").replace(/\/$/, "");
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },

  // Database: Postgres in production (e.g. Supabase), embedded PGlite otherwise.
  get databaseUrl() {
    return read("DATABASE_URL");
  },
  get pgliteDir() {
    return read("PGLITE_DIR") ?? ".data/pglite";
  },

  // Claude
  get anthropicApiKey() {
    return read("ANTHROPIC_API_KEY");
  },
  get agentModel() {
    return read("AGENT_MODEL") ?? "claude-sonnet-5-5";
  },

  // WhatsApp Cloud API (Meta)
  get whatsappToken() {
    return read("WHATSAPP_ACCESS_TOKEN");
  },
  get whatsappAppSecret() {
    return read("WHATSAPP_APP_SECRET");
  },
  get whatsappVerifyToken() {
    return read("WHATSAPP_VERIFY_TOKEN");
  },
  get whatsappGraphVersion() {
    return read("WHATSAPP_GRAPH_VERSION") ?? "v23.0";
  },
  get whatsappTemplateLanguage() {
    return read("WHATSAPP_TEMPLATE_LANGUAGE") ?? "en";
  },

  // Paystack
  get paystackSecretKey() {
    return read("PAYSTACK_SECRET_KEY");
  },
  get paystackEmailDomain() {
    // Paystack needs an email for every payment; WhatsApp customers often have none.
    return read("PAYSTACK_PLACEHOLDER_EMAIL_DOMAIN") ?? "customers.julestechright.com";
  },

  // Dashboard and cron
  get sessionSecret() {
    const value = read("SESSION_SECRET");
    if (value) return value;
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set in production");
    return "dev-only-session-secret-change-me";
  },
  get cronSecret() {
    return read("CRON_SECRET");
  },
  get demoPassword() {
    return read("DEMO_PASSWORD") ?? (process.env.NODE_ENV === "production" ? undefined : "demo1234");
  },
};

export type ServiceMode = "live" | "mock";

export function modes(): { claude: ServiceMode; whatsapp: ServiceMode; paystack: ServiceMode; database: "postgres" | "pglite" } {
  return {
    claude: env.anthropicApiKey ? "live" : "mock",
    whatsapp: env.whatsappToken ? "live" : "mock",
    paystack: env.paystackSecretKey ? "live" : "mock",
    database: env.databaseUrl ? "postgres" : "pglite",
  };
}
