import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

/* ================= SMTP TRANSPORT ================= */
/* In production, configure real SMTP credentials via environment variables.
   For development/demo, we fall back to console logging.            */
const transporter = (() => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  /* Ethereal fallback for demo/testing */
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: process.env.ETHEREAL_USER || "",
      pass: process.env.ETHEREAL_PASS || "",
    },
  });
})();

const hasRealCredentials = Boolean(
  process.env.SMTP_HOST || process.env.ETHEREAL_USER,
);

/* ================= POST /send ================= */
router.post("/send", async (req, res) => {
  try {
    const { to, subject, html, text, from } = req.body || {};

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: "'to' and 'subject' are required",
      });
    }

    const recipients = Array.isArray(to) ? to : [to];

    /* Fallback: log email when no SMTP is configured */
    if (!hasRealCredentials) {
      console.log("\n========== EMAIL (no SMTP configured) ==========");
      console.log(`To:      ${recipients.join(", ")}`);
      console.log(`Subject: ${subject}`);
      console.log(`From:    ${from || "noreply@nidotech.com"}`);
      console.log("------------------------------------------------");
      console.log(text || html || "(no body)");
      console.log("================================================\n");

      return res.json({
        success: true,
        data: {
          messageId: `fallback-${Date.now()}`,
          preview: true,
          recipients,
        },
      });
    }

    const info = await transporter.sendMail({
      from: from || `"Nido Tech" <noreply@nidotech.com>`,
      to: recipients.join(", "),
      subject,
      text: text || "",
      html: html || "",
    });

    res.json({
      success: true,
      data: {
        messageId: info.messageId,
        recipients,
      },
    });
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send email",
    });
  }
});

export default router;
