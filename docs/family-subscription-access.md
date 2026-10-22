# Family subscription access

Verified families require an active, fully paid nanny subscription to open /dashboard/family/new or the live nanny shortlist (?view=matches). Unpaid, expired, cancelled, future or underpaid/refunded membership cycles redirect to Membership & Billing with a clear explanation. Merely returning from checkout does not grant access.

The sidebar and nanny request actions use native disabled controls with muted styling and a Subscription required label until payment is confirmed. Separate View plans links remain active. Request history, match history, profile, messages, billing and caregiver requests remain accessible. Caregiver shortlists have their own Caregiver Shortlist sidebar view and use the independent search/placement fee rules.

The existing transactional nanny-submission API still validates confirmed payment and monthly submission quotas. Admin nanny shortlisting and placement still validate the family’s active paid plan; closing a placement remains possible for agency administration.

Run npm run test:subscription-access for disposable verified local-account checks. This suite makes no outgoing email or external payment requests.
