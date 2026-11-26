type CallConfirmationContent = {
  name: string;
  scheduledFor: string;
  meetingDetails: string;
  reply: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function emailLines(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

export function callConfirmationEmail({ name, scheduledFor, meetingDetails, reply }: CallConfirmationContent) {
  const firstName = name.trim().split(/\s+/)[0] || "there";
  const text = [
    `Hello ${firstName},`,
    "Your call is confirmed. We look forward to speaking with you.",
    `Date and time: ${scheduledFor}`,
    `Meeting details:\n${meetingDetails}`,
    `A note from our team:\n${reply}`,
    "If you need to make a change, reply to this email and our team will be happy to help.",
    "Executive Global Nanny",
  ].join("\n\n");

  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>Your call is confirmed</title></head>
  <body style="margin:0;padding:0;background-color:#f4f7f7;font-family:Arial,Helvetica,sans-serif;color:#173b42;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your call is confirmed for ${escapeHtml(scheduledFor)}.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7f7;">
      <tr><td align="center" style="padding:32px 14px;">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background-color:#ffffff;border:1px solid #dce8e9;border-radius:18px;overflow:hidden;">
          <tr><td style="padding:25px 32px;background-color:#0b3f49;border-bottom:4px solid #ff8a3d;">
            <p style="margin:0;color:#ffffff;font-size:17px;font-weight:700;letter-spacing:.3px;">Executive Global Nanny</p>
            <p style="margin:7px 0 0;color:#c5e1e3;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;">Your appointment</p>
          </td></tr>
          <tr><td style="padding:34px 32px 32px;">
            <p style="display:inline-block;margin:0 0 16px;padding:7px 11px;border-radius:999px;background-color:#e8f5f2;color:#16756f;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Confirmed</p>
            <h1 style="margin:0 0 14px;color:#103f49;font-size:28px;line-height:1.25;font-weight:700;">Your call is confirmed</h1>
            <p style="margin:0 0 10px;color:#334e55;font-size:16px;line-height:1.65;">Hello ${escapeHtml(firstName)},</p>
            <p style="margin:0 0 24px;color:#526970;font-size:15px;line-height:1.7;">We look forward to speaking with you. Your appointment is scheduled for:</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:#eef7f8;border:1px solid #d7e9eb;border-radius:14px;">
              <tr><td style="padding:19px 21px;">
                <p style="margin:0 0 7px;color:#16756f;font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Date and time · Eastern Time</p>
                <p style="margin:0;color:#103f49;font-size:17px;font-weight:700;line-height:1.55;">${escapeHtml(scheduledFor)}</p>
              </td></tr>
            </table>
            <h2 style="margin:0 0 9px;color:#103f49;font-size:16px;line-height:1.4;">Meeting details</h2>
            <div style="margin:0 0 23px;padding:15px 17px;border-left:3px solid #ff8a3d;background-color:#fff8f3;border-radius:0 10px 10px 0;color:#405a60;font-size:14px;line-height:1.75;">${emailLines(meetingDetails)}</div>
            <h2 style="margin:0 0 9px;color:#103f49;font-size:16px;line-height:1.4;">A note from our team</h2>
            <div style="margin:0 0 25px;color:#526970;font-size:14px;line-height:1.75;">${emailLines(reply)}</div>
            <p style="margin:0;color:#526970;font-size:14px;line-height:1.7;">If you need to make a change, simply reply to this email and our team will be happy to help.</p>
          </td></tr>
          <tr><td style="padding:20px 32px;background-color:#f8faf9;border-top:1px solid #e6eeee;">
            <p style="margin:0;color:#103f49;font-size:13px;font-weight:700;">Executive Global Nanny</p>
            <p style="margin:6px 0 0;color:#75888c;font-size:12px;line-height:1.6;">Thoughtful care. Trusted connections.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { text, html };
}
