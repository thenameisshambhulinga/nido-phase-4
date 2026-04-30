import express from "express";
import { sendEmail, verifyEmailService } from "../utils/emailService.js";

const router = express.Router();

/**
 * POST /api/email/send
 * Send email using template system or raw HTML
 * Body: { to, type, data } or { to, subject, html, text }
 */
router.post("/send", async (req, res) => {
  try {
    const { to, type, data, subject, html, text, plainText } = req.body || {};

    if (!to) {
      return res.status(400).json({
        success: false,
        error: "Recipient email is required",
      });
    }

    // Handle template-based emails
    if (type && data) {
      const result = await sendEmail({
        to,
        type,
        data,
        async: false,
      });
      return res.json({
        success: true,
        data: result,
      });
    } else if (subject && (html || text || plainText)) {
      // Raw HTML/text email (legacy support)
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: {
          user: process.env.SMTP_USER || process.env.ETHEREAL_USER,
          pass: process.env.SMTP_PASS || process.env.ETHEREAL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"Nido Tech" <${process.env.EMAIL_FROM || "noreply@nidotech.com"}>`,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html: html || "",
        text: text || plainText || "",
      });

      return res.json({
        success: true,
        data: {
          messageId: info.messageId,
          recipients: Array.isArray(to) ? to : [to],
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Either 'type + data' or 'subject + (html/text)' is required",
      });
    }
  } catch (error) {
    console.error("❌ Email send error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send email",
    });
  }
});

/**
 * GET /api/email/verify
 * Verify email service is working
 */
router.get("/verify", async (req, res) => {
  try {
    const isValid = await verifyEmailService();
    res.json({
      success: isValid,
      message: isValid
        ? "Email service is operational"
        : "Email service verification failed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
