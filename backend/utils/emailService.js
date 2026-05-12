import nodemailer from "nodemailer";
import { generateEmailTemplate } from "./emailTemplateGenerator.js";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const emailQueue = [];
let isProcessing = false;

function createTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

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

  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

const transporter = createTransporter();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logEmail(status, to, subject, details = "") {
  const timestamp = new Date().toISOString();
  console.log(`[EMAIL ${status}] ${timestamp} | To: ${to} | Subject: ${subject} ${details}`);
}

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
      envelope: info.envelope,
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

function queueEmail(mailOptions) {
  emailQueue.push(mailOptions);
  logEmail("QUEUED", mailOptions.to, mailOptions.subject);
  processQueue();
}

async function processQueue() {
  if (isProcessing || emailQueue.length === 0) return;

  isProcessing = true;
  while (emailQueue.length > 0) {
    const mailOptions = emailQueue.shift();
    try {
      await sendEmailWithRetry(mailOptions);
    } catch (error) {
      console.error("Failed to send email after all retries:", error);
    }
    await delay(500);
  }
  isProcessing = false;
}

export async function sendEmail(options) {
  const {
    to,
    type,
    data,
    templateId,
    subject,
    html,
    text,
    from = process.env.EMAIL_FROM || "no-reply@nido.com",
    async: isAsync = true,
  } = options;

  if (!to) throw new Error("Email recipient is required");

  try {
    let template;

    if (subject && html) {
      template = {
        subject,
        html,
        text: text || "",
      };
    } else if (type && data) {
      template = generateEmailTemplate(type, data);
    } else if (templateId) {
      throw new Error("Custom templates not yet supported");
    } else {
      throw new Error(
        "Either 'subject + html' or 'type + data' or 'templateId' is required",
      );
    }

    const mailOptions = {
      from: `"Nido Tech" <${from}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject: template.subject,
      html: template.html,
      text: template.text || "",
      headers: {
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        "X-Mailer": "Nido Tech Email Service",
      },
    };

    if (isAsync) {
      queueEmail(mailOptions);
      return {
        success: true,
        queued: true,
        message: "Email queued for delivery",
      };
    } else {
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

export async function verifyEmailService() {
  try {
    if (transporter.options?.jsonTransport) {
      return true;
    }
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("Email service verification failed:", error.message);
    return false;
  }
}

export default { sendEmail, verifyEmailService };
