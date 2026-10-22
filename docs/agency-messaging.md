# Private agency messaging

Each family or nanny/caregiver has one private conversation with the agency team. All administrators can reply. Members can message the agency without a match or subscription. Admins can search members by name and start a conversation.

Migration 0014 adds a unique member ID while retaining old shared conversations. Legacy booking/match threads are inaccessible through pages and APIs, including to admins; no old messages are copied into private chats. Historical data is preserved in the database.

The responsive interface has a conversation list, search, previews, unread counts, date groups, message bubbles, sent indicators, a fixed composer and earlier-message loading. It polls every five seconds while visible; this is not a WebSocket connection. A sent check means saved, not read by the other person. Times use the browser timezone.

API authorization enforces ownership on read, send and read cursors. Conversation creation locks the member; sending locks the thread. Retries use request keys. Origin validation, message limits and rate limiting remain. Email notifications omit message content, and only notify the member or agency administrators.

Run `npm run test:messaging` against the local database/server. Tests create verified disposable users directly and queue notifications without calling SMTP; fixtures are deleted afterwards.

## Browser checks

`node scripts/check-chat-ui.mjs --assert` checks isolated local family, caregiver and admin accounts at desktop, tablet, phone and landscape sizes. It verifies viewport fit, long text, sending/receiving, persistence, mobile navigation and a 320px keyboard-height viewport. Screenshots are saved under ignored `.data/chat-qa`. It uses bundled Playwright and installed Chrome; override `PLAYWRIGHT_MODULE_PATH` and `CHROME_PATH` on another machine. No signup email or SMTP delivery is invoked. Temporary messages and queued notifications are removed.

## Attachments, links and replies

All family, nanny/caregiver and admin accounts can attach JPEG/PNG/WebP images, PDF, Word `.docx` and UTF-8 `.txt` documents. Each file is limited to 10 MB, with at most five files and 25 MB total per message. Each uploader is limited to ten unsent uploads and twenty files / 100 MB in a rolling 24 hours. Failed uploads can be retried, and unsent attachments can be removed. Text is optional when a message includes attachments.

Images are decoded, checked against their extension and re-encoded without original metadata; images over twenty megapixels and animated images are rejected. Document signatures/container directories are checked; macro/ActiveX DOCX containers are rejected. Documents always download with `nosniff` and sandbox headers. These format checks do not constitute an antivirus scan.

Files live in ignored `.data/chat-uploads`, outside Next.js `public`. The authenticated file endpoint checks conversation ownership on every request. Unsent files are visible only to their uploader and expire after 24 hours. Once sent, the conversation member and agency administrators can preview/download them. No public URLs, storage names or email attachments are exposed. Preserve this private folder along with the database when backing up or deploying.

The upload endpoint bounds the request stream, checks size/type, serializes quota checks, and uses upload keys for retry safety. Sending claims uploaded files and the reply reference in the same transaction as the message. Attachments and replies from other conversations are rejected. Existing request keys make retries safe for text, attachments and quoted replies together.

HTTP/HTTPS and www URLs become safe clickable links; raw HTML and other protocols remain text. Links open with `noopener noreferrer`; the server never fetches link previews. Every message has a Reply action. Quoted previews can jump to the original message, including messages outside the latest page. Earlier-message mode pauses live appends until Back to latest, avoiding gaps in history.

Expired pending uploads are reclaimed on subsequent uploads. Run `npm run chat:cleanup` periodically on the hosting server to remove abandoned drafts even when the uploader never returns. Sent attachments do not expire.

Verification: `npm run test:chat-attachments` exercises uploads, access isolation, quotas, retry safety, replies, expiry and cleanup. `node scripts/check-chat-rich-ui.mjs` checks desktop admin and mobile family/nanny flows, including upload failure/retry, image previews, private downloads, clickable links and old-message replies. Both use disposable local fixtures and clean up uploaded files and queued notifications; neither calls SMTP.
