import nodemailer from "nodemailer";

const createTransporter = () => {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
  const secure =
    String(process.env.EMAIL_SECURE || "").toLowerCase() === "true" ||
    port === 465;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  return null;
};

export async function sendMail({ to, subject, html, text, from }) {
  const recipients = Array.isArray(to) ? to : [to];
  const transporter = createTransporter();

  if (!transporter) {
    console.log("EMAIL PREVIEW", {
      to: recipients,
      subject,
      text: text || html,
    });
    return { preview: true, recipients };
  }

  const info = await transporter.sendMail({
    from: from || process.env.EMAIL_FROM || "Nido Tech <noreply@nidotech.com>",
    to: recipients.join(", "),
    subject,
    html,
    text,
  });

  return { messageId: info.messageId, recipients };
}
