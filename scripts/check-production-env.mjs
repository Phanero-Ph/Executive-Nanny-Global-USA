import "dotenv/config";

const expectedOrigin = "https://executiveglobalnannyusa.com";
const errors = [];
const warnings = [];
const required = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "APP_URL",
  "EMAIL_MODE",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "MAIL_FROM",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_BASIC",
  "STRIPE_PRICE_STANDARD",
  "STRIPE_PRICE_DELUXE",
  "STRIPE_PRICE_PREMIUM",
  "STRIPE_PORTAL_CONFIGURATION",
  "STRIPE_ALLOW_LIVE",
];

for (const name of required) {
  if (!process.env[name]?.trim()) errors.push(`${name} is missing.`);
}

if (process.env.NODE_ENV !== "production") errors.push("NODE_ENV must be production.");
if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
  errors.push("SESSION_SECRET must contain at least 32 characters.");
}
if (process.env.EMAIL_MODE && process.env.EMAIL_MODE !== "smtp") {
  errors.push("EMAIL_MODE must be smtp; preview mail is disabled in production.");
}
if (process.env.DATABASE_URL) {
  try {
    const databaseUrl = new URL(process.env.DATABASE_URL);
    if (databaseUrl.protocol !== "mysql:" || !databaseUrl.hostname || !databaseUrl.pathname.slice(1)) {
      errors.push("DATABASE_URL must identify a MySQL database and host.");
    }
    if (process.env.DATABASE_URL.includes("database_user") || process.env.DATABASE_URL.includes("database_password")) {
      errors.push("DATABASE_URL still contains the example credentials.");
    }
  } catch {
    errors.push("DATABASE_URL is not a valid MySQL connection URL.");
  }
}
if (process.env.APP_URL) {
  try {
    const appUrl = new URL(process.env.APP_URL);
    if (appUrl.origin !== expectedOrigin || appUrl.pathname !== "/" || appUrl.search || appUrl.hash) {
      errors.push("APP_URL must be https://executiveglobalnannyusa.com with no path or query.");
    }
  } catch {
    errors.push("APP_URL must be a valid HTTPS URL.");
  }
}
if (process.env.STRIPE_SECRET_KEY && !/^sk_(test|live)_/.test(process.env.STRIPE_SECRET_KEY)) {
  errors.push("STRIPE_SECRET_KEY does not look like a Stripe secret key.");
}
if (process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")) {
  errors.push("STRIPE_WEBHOOK_SECRET does not look like a Stripe endpoint signing secret.");
}
for (const name of ["STRIPE_PRICE_BASIC", "STRIPE_PRICE_STANDARD", "STRIPE_PRICE_DELUXE", "STRIPE_PRICE_PREMIUM"]) {
  if (process.env[name] && !process.env[name].startsWith("price_")) errors.push(`${name} is not a Stripe Price ID.`);
}
if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") && process.env.STRIPE_ALLOW_LIVE !== "true") {
  errors.push("Set STRIPE_ALLOW_LIVE=true to enable live Stripe payments.");
}
if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
  warnings.push("Stripe is in test mode. Families will not be charged real subscription or service fees.");
}
if (process.env.SMTP_PORT && !["465", "587"].includes(process.env.SMTP_PORT)) {
  errors.push("SMTP_PORT should be 465 or 587.");
}
if (process.env.MAIL_FROM && !/^\S+@\S+\.\S+$/.test(process.env.MAIL_FROM)) {
  errors.push("MAIL_FROM must be an email address.");
}
if (process.env.STRIPE_PORTAL_CONFIGURATION && !process.env.STRIPE_PORTAL_CONFIGURATION.startsWith("bpc_")) {
  errors.push("STRIPE_PORTAL_CONFIGURATION should be a Stripe billing portal configuration ID (bpc_...).");
}
if (process.env.STRIPE_ALLOW_LIVE && !["true", "false"].includes(process.env.STRIPE_ALLOW_LIVE)) {
  errors.push("STRIPE_ALLOW_LIVE must be true or false.");
}
if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") && process.env.STRIPE_ALLOW_LIVE === "true") {
  console.log("Stripe live mode is enabled. Confirm that live products, prices, webhook, and portal configuration are in use.");
}

if (errors.length) {
  console.error("Production configuration is incomplete:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Production environment variables are present and have valid formats.");
}
for (const warning of warnings) console.warn(`Warning: ${warning}`);
