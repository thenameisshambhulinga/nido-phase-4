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
