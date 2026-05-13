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

    const recipients = Array.isArray(to) ? to : [to];

    // Strict email validation: reject any invalid recipient
    // (must NEVER accept invalid email IDs)
    for (const recipient of recipients) {
      if (typeof recipient !== "string") {
        return res.status(400).json({
          success: false,
          error: "Invalid recipient email address",
        });
      }

      const normalized = recipient.trim().toLowerCase();
      const isValid =
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized) &&
        // Reject local-part that looks like a domain: name.com@gmail.com
        !/\.(com|org|net|io|co|in|gov|edu|ac|ai|ml|tk|ga|cf|gq|xyz|top|link)$/i.test(
          normalized.split("@")[0] || "",
        );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: "Invalid recipient email address",
        });
      }
    }

    // Ensure downstream receives original array (not mutated)
    req.body.to = recipients;

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
    } else if (subject && html) {
      const info = await sendEmail({
        to,
        subject,
        html,
        text: text || plainText || "",
        async: false,
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
