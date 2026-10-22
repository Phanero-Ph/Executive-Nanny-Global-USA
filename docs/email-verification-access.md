# Email verification before dashboard access

Family and nanny accounts must verify their registered email before dashboard access. Existing unverified accounts are also gated; no accounts are automatically marked verified. Administrator access is unchanged.

Login establishes a session for verification and recovery, then sends unverified families/nannies to /verify-email. That page displays the registered email, resend controls and sign-out. Token verification does not sign in another account; anonymous recipients still sign in with their password afterward.

Protected APIs use getCurrentUser(), which excludes unverified family/nanny accounts by default. Dashboard pages use getDashboardUser(), which redirects those accounts to verification. Only verification/onboarding and account identity endpoints opt into reading unverified sessions. Logged-in unverified users cannot bypass this through public application/request endpoints.

Valid, unexpired, single-use verification tokens set the database verification timestamp. Existing sessions then unlock without issuing a new session. Invalid, expired and reused tokens do not unlock access.

Run npm run test:email-access for disposable local-account checks. It creates tokens directly and sends no email. Other business-domain fixture suites explicitly mark their disposable users verified before exercising protected features.
