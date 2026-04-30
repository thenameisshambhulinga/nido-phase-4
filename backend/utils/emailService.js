/**
 * Production-Grade Email Sending Service
 * Features: Retry logic, async sending, comprehensive logging
 */

import nodemailer from "nodemailer";
import { generateEmailTemplate } from "./emailTemplateGenerator.js";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // ms

/**
 * Email sending queue for async processing
 */
const emailQueue = [];
let isProcessing = false;

/**
 * Initialize mail transporter
 */
function createTransporter() {
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
      pool: {
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 4000,
        rateLimit: 14,
      },
    });
  }

  // Fallback: Ethereal email for demo/testing
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: process.env.ETHEREAL_USER || "test@ethereal.email",
      pass: process.env.ETHEREAL_PASS || "test_password",
    },
  });
}

const transporter = createTransporter();

/**
 * Delay utility
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Log email activity
 */
function logEmail(status, to, subject, details = "") {
  const timestamp = new Date().toISOString();
  const icon =
    {
      SENDING: "📤",
      SUCCESS: "✅",
      FAILED: "❌",
      QUEUED: "📋",
      RETRY: "🔄",
    }[status] || "ℹ️";

  console.log(
    `${icon} [EMAIL ${status}] ${timestamp} | To: ${to} | Subject: ${subject} ${details}`,
  );
}

/**
 * Send email with retry logic
 */
async function sendEmailWithRetry(mailOptions, retryCount = 0) {
  try {
    logEmail(
      retryCount > 0 ? "RETRY" : "SENDING",
      mailOptions.to,
      mailOptions.subject,
      retryCount > 0 ? `(Attempt ${retryCount + 1}/${MAX_RETRIES + 1})` : "",
    );

    const info = await transporter.sendMail(mailOptions);

    logEmail(
      "SUCCESS",
      mailOptions.to,
      mailOptions.subject,
      `| Message ID: ${info.messageId}`,
    );

    return {
      success: true,
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(
        `⚠️ [EMAIL RETRY] Retrying in ${RETRY_DELAY}ms... (${retryCount + 1}/${MAX_RETRIES})`,
      );
      await delay(RETRY_DELAY);
      return sendEmailWithRetry(mailOptions, retryCount + 1);
    }

    logEmail(
      "FAILED",
      mailOptions.to,
      mailOptions.subject,
      `| Error: ${error.message}`,
    );

    throw error;
  }
}

/**
 * Queue email for async processing
 */
function queueEmail(mailOptions) {
  emailQueue.push(mailOptions);
  logEmail("QUEUED", mailOptions.to, mailOptions.subject);
  processQueue();
}

/**
 * Process email queue in background
 */
async function processQueue() {
  if (isProcessing || emailQueue.length === 0) return;

  isProcessing = true;
  while (emailQueue.length > 0) {
    const mailOptions = emailQueue.shift();
    try {
      await sendEmailWithRetry(mailOptions);
    } catch (error) {
      console.error(`Failed to send email after all retries:`, error);
    }
    // Stagger sends to avoid rate limiting
    await delay(500);
  }
  isProcessing = false;
}

/**
 * Main email sender function
 */
export async function sendEmail(options) {
  const {
    to,
    type,
    data,
    templateId,
    from = process.env.EMAIL_FROM || "noreply@nidotech.com",
    async: isAsync = true,
  } = options;

  if (!to) throw new Error("Email recipient is required");

  try {
    let template;

    if (type && data) {
      // Generate from template type
      template = generateEmailTemplate(type, data);
    } else if (templateId) {
      // Custom template (if supported)
      throw new Error("Custom templates not yet supported");
    } else {
      throw new Error("Either 'type + data' or 'templateId' is required");
    }

    const mailOptions = {
      from: `"Nido Tech" <${from}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      headers: {
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        "X-Mailer": "Nido Tech Email Service",
      },
    };

    if (isAsync) {
      // Queue for background processing
      queueEmail(mailOptions);
      return {
        success: true,
        queued: true,
        message: "Email queued for delivery",
      };
    } else {
      // Send immediately and wait
      return await sendEmailWithRetry(mailOptions);
    }
  } catch (error) {
    logEmail(
      "FAILED",
      to,
      options.type || "Unknown",
      `| Error: ${error.message}`,
    );
    throw error;
  }
}

/**
 * Health check for email service
 */
export async function verifyEmailService() {
  try {
    await transporter.verify();
    console.log("✅ Email service verified successfully");
    return true;
  } catch (error) {
    console.error("❌ Email service verification failed:", error.message);
    return false;
  }
}

export default { sendEmail, verifyEmailService };
