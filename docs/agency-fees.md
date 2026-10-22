# Caregiver company fees

Administrators can edit **Search & placement fees** in **Team & settings** (`/dashboard/admin/settings`). Amounts are USD, from $0.50 to $10,000, with at most two decimal places. Defaults remain $50 each. Nanny subscription prices and caregiver wages are unaffected.

Migration 0016 adds the singleton `agency_fee_settings` table. Updates require administrator authorization, same-origin requests, and the current revision. Changes are recorded in `review_events` with old and new integer-cent amounts.

New caregiver requests snapshot both fees into `caregiver_fees` in the request transaction. Existing issued fees retain their amounts, even if their checkout expires and is retried. Legacy requests without an issued fee use the current configured amount when the fee is first issued. Checkout and webhook/recovery validation use the saved fee amount rather than the current setting. Admin visibility still requires a verified search payment, including for non-default prices.

Public pricing, services and the caregiver request page display configured prices. Request payment controls and admin request reviews display saved request prices. Other guidance describes the fees without fixed dollar amounts.

Run `npm run test:stripe` with `EMAIL_MODE=preview` against the local database. Stripe is mocked; the test checks fee permissions, validation, concurrent edits, quote snapshots, checkout amounts, payment confirmation and request visibility. It restores original settings and removes fixtures. `node scripts/check-fee-settings-ui.mjs` checks desktop and mobile settings controls with a temporary local admin.
