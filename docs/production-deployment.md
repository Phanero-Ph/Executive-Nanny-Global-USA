# Production deployment: Namecheap cPanel

This guide prepares the Next.js application for `https://executiveglobalnannyusa.com/` on Namecheap shared hosting. It assumes a cPanel plan with **Setup Node.js App** / Passenger support and MySQL. Do not upload `.env`, database dumps, or private files into `public_html`.

## 1. Confirm hosting and domain

In Namecheap, confirm the hosting package supports Node.js applications and that the domain is attached to the cPanel account. Point the domain's DNS to the hosting account as instructed by Namecheap, then enable AutoSSL/HTTPS in cPanel. Wait until `https://executiveglobalnannyusa.com/` has a valid certificate before setting `APP_URL` or enabling live payment flows.

Namecheap's current cPanel guide uses a custom `server.js` entry point for Next.js deployments. The repository now includes that entry point. Select Node.js 22 in cPanel, which is a currently supported cPanel runtime.

## 2. Create the production database

In cPanel **MySQL Database Wizard** (or MySQL Databases):

1. Create a dedicated database and a dedicated database user with a strong, unique password.
2. Grant that user all privileges on this application database.
3. Record the full cPanel-prefixed database and username, host, and password in a password manager.
4. Do not use the local development database or reuse a local password.

DATABASE_URL=mysql://DB_USER:DB_PASSWORD@DB_HOST:3306/DB_NAME

## 3. Upload and configure the Node.js app

1. Create an application root outside `public_html`, for example `/home/CPANEL_USER/egn-app`.
2. Upload the source/deployment package there. Include `server.js`, `package.json`, the lockfile, `next.config.ts`, `src`, `public`, `database`, `scripts`, and all files needed by the build. Exclude `.env*` (except `.env.example` if desired), `.git`, local `.data`, `node_modules`, and development build output.
3. In cPanel **Setup Node.js App**, create an application for `executiveglobalnannyusa.com`, choose Node.js 22, set application mode to **Production**, set the application root to the private directory, and set the startup file to `server.js`.
4. Add the variables in the next section through the cPanel application environment-variable controls. Keep secrets out of source code and public folders.
5. Run `npm ci` in the app environment. Run `npm run production:check` after the variables are configured. Build with `npm run build`, then restart the app from the cPanel Node.js application screen.

If the host requires a Passenger-specific application URL or startup command, follow the exact values displayed in that cPanel screen. The server binds to cPanel's `PORT` and `HOST` environment variables.

## 4. Set environment variables

Configure these in the cPanel app environment. Never commit real values to Git or paste them into chat.

```text
NODE_ENV=production
APP_URL=https://executiveglobalnannyusa.com
DATABASE_URL=mysql://CPANEL_DB_USER:URL_ENCODED_PASSWORD@DB_HOST:3306/CPANEL_DB_NAME
SESSION_SECRET=<unique random secret, at least 32 characters>

EMAIL_MODE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=egnmails@gmail.com
SMTP_PASS=<Gmail App Password>
MAIL_FROM=egnmails@gmail.com

STRIPE_SECRET_KEY=<Stripe live secret key beginning sk_live_>
STRIPE_WEBHOOK_SECRET=<live webhook endpoint signing secret beginning whsec_>
STRIPE_PRICE_BASIC=<live recurring Price ID>
STRIPE_PRICE_STANDARD=<live recurring Price ID>
STRIPE_PRICE_DELUXE=<live recurring Price ID>
STRIPE_PRICE_PREMIUM=<live recurring Price ID>
STRIPE_PORTAL_CONFIGURATION=<live Customer Portal configuration ID>
STRIPE_ALLOW_LIVE=true
```

Use the Gmail App Password, not the normal Gmail password. Use the Stripe **live-mode** products, prices, webhook secret, and portal configuration for production; test-mode IDs are separate and cannot charge real customers. Keep a separate secure record of all production secrets.

Generate a session secret locally with Node.js, then paste its output directly into cPanel without sharing it:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

The `production:check` command validates the presence and format of required settings without printing secret values. A warning that Stripe is in test mode means real payments are disabled.

## 5. Initialize the database

For a **new empty production database**, apply migrations once from the application root after `DATABASE_URL` is configured:

```sh
npm run db:migrate
npm run db:check
```

Do not import `database/schema.sql` and then also run migrations on the same empty database. If this is a migration of existing production data, first take a full backup and follow the migration history against a staging copy. Never point production at the local database.

Create the first production administrator with the guarded one-time invitation bootstrap after confirming the cPanel environment points at the production database. From the application root in cPanel Terminal, set `NODE_ENV=production`, `APP_URL=https://executiveglobalnannyusa.com`, `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_BOOTSTRAP_CONFIRM=CREATE_FIRST_PRODUCTION_SUPER_ADMIN`, then run:

```sh
npm run admin:bootstrap
npm run mail:retry
```

This creates a Super Admin invitation and queues an email; it does not create or print a password. The invited administrator verifies their email and chooses their own password using the emailed link. The bootstrap refuses to run unless the production URL and explicit confirmation are set, and refuses if any administrator or account using that email already exists. Remove the temporary `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_BOOTSTRAP_CONFIRM` values after the first invitation is sent. Do not use the `admin:create` helper in production; it is intentionally restricted to local accounts.

## 6. Configure the Stripe webhook

In Stripe **live mode**, add endpoint `https://executiveglobalnannyusa.com/api/billing/webhook`. Subscribe it to the event types handled by the app:

- `checkout.session.completed`
- `checkout.session.expired`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `charge.refunded`

Copy this endpoint's live signing secret into `STRIPE_WEBHOOK_SECRET`. The live endpoint secret differs from test mode and from the local Stripe CLI secret. Send a test event from Stripe and verify a successful `2xx` delivery in the Stripe dashboard before accepting payments.

## 7. Keep private uploads and recovery jobs working

The app stores nanny documents, credentials, training files, chat attachments, and queued email data on disk under `.data`. On the server, keep this directory under the private application root and outside `public_html`. Create it with write access for the Node.js app user, restrict access to that user, and ensure it survives deployments. Back it up encrypted together with the database; test restoring both. A code-only redeploy must not overwrite or delete `.data`.

Set cPanel **Cron Jobs** to run from the application root using the Node.js executable and the app's configured environment. These scripts load `.env` where present; cPanel environment variables are not automatically inherited by all cron configurations. Use a private environment file outside `public_html` for cron if cPanel cannot inject the application's variables into cron. Keep it readable only by the app account, do not include it in deployments or backups that are not encrypted, and ensure it contains the same production settings. Direct logs to a private log file:

| Frequency | Command | Purpose |
| --- | --- | --- |
| Every 5 minutes | `node scripts/process-mail.mjs` | Retry queued application email |
| Every 5 minutes | `node_modules/.bin/tsx scripts/recover-stripe.ts` | Reconcile missed Stripe webhook updates |
| Daily | `node scripts/membership-reminders.mjs` | Send subscription reminders |
| Daily | `node scripts/credential-reminders.mjs` | Send credential expiry reminders |
| Daily | `node_modules/.bin/tsx scripts/cleanup-chat-uploads.ts` | Remove expired chat uploads |

Do not run overlapping copies of a job. If the hosting plan does not provide the Node.js executable/environment to cron, ask Namecheap support for its cPanel Node.js path and environment setup; do not substitute a Windows scheduled task on the production host.

## 8. Pre-launch smoke test

Run these checks against the production build before announcing the site:

```sh
npm run production:check
npm run typecheck
npm run lint
npm run build
npm run db:check
```

Then verify, using non-sensitive test accounts and Stripe's approved live-mode test procedure where applicable:

- Home page, public pages, login, registration, email verification, and password reset load over HTTPS.
- Family and nanny dashboards are protected until email verification and authentication.
- Admin pages are role-protected; create a second admin only with least-privilege permissions.
- Email delivery and the verification/reset links use `https://executiveglobalnannyusa.com`.
- A Stripe webhook delivery returns `2xx`; payment status updates and recovery jobs complete.
- Private uploaded PDF, DOCX, image, and chat files preview only to authorized users.
- Uploaded files remain available after an app restart and a code deployment.
- Search, placement, and subscription fee amounts shown to the family match admin settings.
- No test Stripe keys, local URLs, demo accounts, or development-only credentials are in production.

## Remaining account-specific work

The repository can be built and checked locally, but DNS, AutoSSL, cPanel app creation, production MySQL credentials, production secrets, live Stripe configuration, and cron jobs must be entered in the hosting/Stripe accounts. These account values are intentionally not stored in this repository.
