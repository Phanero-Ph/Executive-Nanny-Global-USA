# Agency chat availability

Administrators manage **Chat availability** in **Team & settings**. Family chat and Nanny / caregiver chat are independent switches; click **Save chat settings** to apply changes. Both are enabled by default. Changes require administrator authorization and the current revision, and are recorded in the review audit history.

Disabling a group hides its dashboard Messages navigation, header button, placement/booking message actions and request-page message links. Authenticated chat pages redirect disabled members to their dashboard. Inbox, creation, sending, read receipts, uploads and private file access enforce the setting on the server. Admin contacts and inbox exclude disabled groups, and new admin messages to those groups are blocked. Administrators retain access to the settings and enabled groups.

Open dashboards poll the private availability endpoint every 15 seconds and when the window receives focus. Refresh applies the setting immediately. Conversations and published attachments are retained and become accessible when the group is enabled again; existing draft-upload expiry rules still apply.

Migration 0017 adds `agency_chat_settings`. Run `npm run test:chat-controls` for local database/API tests (temporary users and files, original settings restored). Run `node scripts/test-chat-controls-ui.mjs` for server-rendered visibility checks across all role and switch combinations.
