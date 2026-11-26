import type { Transporter } from "nodemailer";
export function packHtmlEmail(text: string, html: string): string;
export function mailDeliveryIssue(error: unknown): string;
export function smtpTransport(): Transporter;
export function deliverMail(job: { id: string; recipient: string; subject: string; body: string }): Promise<"preview" | "sent">;
