# Family placement flows

Family subscriptions cover babysitter requests only: Basic 3, Standard 5, Deluxe 8 and Premium unlimited submissions per paid membership period. Existing monthly Stripe price IDs remain unchanged.

Nanny requests require no family subscription. New requests snapshot the current search fee ($300 by default) and placement rate (15% by default). The search fee must be confirmed by Stripe before the request is available to the agency. A browser return alone does not confirm payment.

An administrator with `payments.manage` opens the family submission, selects an approved shortlisted nanny and records the agreed annual salary in USD. The server calculates salary cents multiplied by basis points, rounding once to the nearest cent. Publishing sets the request to Placement fee due. For example, $60,000 × 15% = $9,000. The family sees the selected nanny, salary, percentage and fee, and can pay; families cannot enter or alter those figures.

A quote can be revised with optimistic concurrency until checkout starts. Starting checkout locks the quote, including during a temporary Stripe outage. Payment retries reuse the saved amount and checkout key. Confirmed placement must use the nanny named on the invoice, and both fees must be paid. Screening and credential checks still apply. Wages and payroll are not processed.

Agency Settings allows administrators with `settings.fees` to change the search fee and percentage for future requests. Existing request snapshots and issued invoices retain their amounts. Financial management and matching permissions remain separate.

Migration 0019 preserves paid fees and invoices with an existing Stripe checkout. Unissued unpaid legacy placement stubs are removed so the agency must publish a salary-based quote. Unissued unpaid search fees become $300. Previously issued fixed placement invoices retain their original amount and are labelled accordingly.

Internal category identifiers and existing URLs remain compatible: legacy `nanny` means subscription babysitting; legacy `caregiver` means salary-based nanny placement. Use `careCategoryLabel` for presentation. Never globally rename stored categories.

Verification: `npm run test:stripe` in EMAIL_MODE=preview exercises mocked Stripe payments and temporary local records; no Stripe network calls occur. `npm run test:admin-permissions` uses an isolated database.
