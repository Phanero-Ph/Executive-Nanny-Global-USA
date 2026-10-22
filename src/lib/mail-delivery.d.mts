import type { Transporter } from "nodemailer";
export function smtpTransport(): Transporter;
export function deliverMail(job: { id: string; recipient: string; subject: string; body: string }): Promise<"preview" | "sent">;
