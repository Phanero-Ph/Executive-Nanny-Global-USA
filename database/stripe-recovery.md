# Stripe event recovery

`npm run stripe:recover` fetches the last 30 days of relevant events directly from Stripe and processes missing events using the same transactional handler as webhooks. It never creates charges. Recorded event IDs and invoice IDs prevent duplicate memberships, receipts and confirmation emails, including when webhooks arrive concurrently. Failures remain unrecorded and retry on the next run. Events for other applications' customers are ignored.

The command requires database access and the application's Stripe secret key and price IDs. It does not require the Next.js server or local Stripe listener. Live keys require `STRIPE_ALLOW_LIVE=true`, as with checkout. It queues confirmation emails but does not send or drain the mail queue.

On Windows, run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install-stripe-recovery-task.ps1`. The Task Scheduler entry `ExecutiveNanny-StripeRecovery` runs every five minutes while the installing user is signed in. Logs are in `.data/stripe-recovery.log`. The next run catches up after sleep or connectivity failures. Inspect failures in Task Scheduler and the log. Remove with `Unregister-ScheduledTask -TaskName ExecutiveNanny-StripeRecovery -Confirm:$false`.

On hosting, install production dependencies (tsx is a runtime dependency) and configure a cron job every five minutes using absolute paths, for example:

```cron
*/5 * * * * cd /absolute/project/path && /absolute/node/path /absolute/project/path/node_modules/tsx/dist/cli.mjs /absolute/project/path/scripts/recover-stripe.ts >> /absolute/project/path/.data/stripe-recovery.log 2>&1
```

Set up the public HTTPS webhook separately for immediate delivery. The recovery job is a fallback and can take up to five minutes. Stripe only retains retrievable events for 30 days; outages beyond this require a separate invoice reconciliation. Runs stop with an error above 10,000 scanned events; review logs and adjust the approach if account volume reaches that limit. A MySQL advisory lock prevents concurrent scheduled scans. Webhooks remain independently safe through the account transaction lock.

Reference: https://docs.stripe.com/api/events/list
