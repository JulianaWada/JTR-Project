// Tests always run against mocks, whatever is in the developer's environment.
for (const key of ["ANTHROPIC_API_KEY", "WHATSAPP_ACCESS_TOKEN", "PAYSTACK_SECRET_KEY", "DATABASE_URL"]) {
  delete process.env[key];
}
process.env.APP_URL = "https://agent.test";
process.env.SKIP_DEMO_SEED = "true";
