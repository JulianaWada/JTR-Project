// Tests always run against test mode, whatever is in the developer's environment.
for (const key of ["ANTHROPIC_API_KEY", "PAYSTACK_SECRET_KEY", "RESEND_API_KEY", "DATABASE_URL"]) {
  delete process.env[key];
}
process.env.APP_URL = "https://academy.test";
process.env.SKIP_DEMO_SEED = "true";
