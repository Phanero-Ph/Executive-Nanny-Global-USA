# Administrator workspace

- Family Requests: filter paid caregiver requests and nanny requests by category/status.
- Caregiver Applications: review recruitment submissions, screening and reference checks.
- Families: search accounts; open a profile for contact edits, membership management, visible requests and match history.
- Nannies & Caregivers: search registered caregivers, including accounts without applications. Filter by application status. Profiles include availability, experience, services, credential status, screening readiness, applications and placements. Contact edits are audited; application approval continues to require screening and verified credentials.
- Matching & Placements, Credential Reviews, Training Academy and Messages retain their existing tools.
- Payments & Billing: consolidated confirmed subscription receipts and caregiver fees, recorded refunds/voids, search and filters. Open a family account for manual membership controls. Stripe refunds continue to be issued in Stripe.
- Reports: all-time pipeline totals by current status; summary and payment CSV exports. Exports require administrator access and neutralize spreadsheet formulas in text cells.
- Team & Settings: administrator roster, own contact settings and configuration status. Invitations, custom permission roles and deployment secret editing are not provided.

Pending unpaid caregiver requests stay hidden in request lists, family profile history, placement history and reports.

Validation: npm run test:admin checks account changes, access restrictions, stale edits, audit records, exports and authenticated pages with temporary local database fixtures. It never sends mail or contacts Stripe.
