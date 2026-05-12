import { apiRequest } from "@/lib/api";

export interface EmailTemplate {
  subject: string;
  html: string;
  plainText: string;
}

const baseEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; background-color: #f4f7fb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
  .wrapper { width: 100%; padding: 40px 0; background-color: #f4f7fb; }
  .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #2c4a6e, #1e3a5f); padding: 24px; color: white; font-size: 20px; font-weight: 600; text-align: center; }
  .content { padding: 32px; color: #333; font-size: 15px; line-height: 1.7; }
  h1 { font-size: 22px; margin-bottom: 16px; color: #111; }
  p { margin: 12px 0; }
  .highlight { font-weight: 600; color: #2c4a6e; }
  .button { display: inline-block; margin-top: 20px; padding: 14px 24px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
  .link { color: #2563eb; word-break: break-all; }
  .footer { text-align: center; font-size: 12px; color: #777; padding: 20px; background: #f1f5f9; }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">Nido Tech CorpEssentials</div>
      <div class="content">${content}</div>
      <div class="footer">© 2026 Nido Tech. All rights reserved.<br/>support@nido.com</div>
    </div>
  </div>
</body>
</html>
`;

const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export const emailTemplates = {
  userCredentials: (data: {
    username: string;
    email: string;
    temporaryPassword: string;
    createdBy: string;
    userType: string;
    loginUrl: string;
  }): EmailTemplate => ({
    subject: `Complete your Nido Tech account setup`,
    html: baseEmailTemplate(`
      <h1>Welcome to Nido Tech</h1>
      <p>Hello <span class="highlight">${data.username}</span>,</p>
      <p>Your account was created by <b>${data.createdBy}</b>. Use the link below to sign in and complete your password setup.</p>
      <p><b>Username:</b> ${data.username}<br/><b>Email:</b> ${data.email}<br/><b>Temporary Password:</b> ${data.temporaryPassword}</p>
      <a href="${data.loginUrl}" class="button">Go To Login</a>
      <p>Login link:<br/><span class="link">${data.loginUrl}</span></p>
      <p>This temporary password will expire after your first reset.</p>
    `),
    plainText: `Welcome to Nido Tech. Username: ${data.username}. Temporary password: ${data.temporaryPassword}. Login: ${data.loginUrl}`,
  }),

  orderConfirmation: (order: {
    id: string;
    shippingInfo: { email: string; fullName: string };
    items: Array<{ name: string; quantity: number }>;
    total: number;
    orderDate: string;
  }): EmailTemplate => ({
    subject: `Order Confirmation — ${order.id}`,
    html: baseEmailTemplate(`
      <h1>Order Confirmation</h1>
      <p>Hello <span class="highlight">${order.shippingInfo.fullName}</span>,</p>
      <p>Your order <b>${order.id}</b> has been placed successfully.</p>
      <ul>${order.items.map((item) => `<li>${item.name} (Qty: ${item.quantity})</li>`).join("")}</ul>
      <p><b>Total:</b> ${formatCurrency(order.total)}</p>
      <p>We will notify you once it is approved and processed.</p>
    `),
    plainText: `Order ${order.id} placed successfully. Total ${formatCurrency(order.total)}.`,
  }),

  orderApproved: (order: {
    id: string;
    shippingInfo: { email: string; fullName: string };
    total: number;
  }): EmailTemplate => ({
    subject: `Order Approved — ${order.id}`,
    html: baseEmailTemplate(`
      <h1>Order Approved</h1>
      <p>Hello <span class="highlight">${order.shippingInfo.fullName}</span>,</p>
      <p>Your order <b>${order.id}</b> has been approved.</p>
      <p><b>Total:</b> ${formatCurrency(order.total)}</p>
      <p>Your order is now moving to vendor fulfillment.</p>
    `),
    plainText: `Order ${order.id} approved. Total ${formatCurrency(order.total)}.`,
  }),

  orderRejected: (order: {
    id: string;
    shippingInfo: { email: string; fullName: string };
    rejectionReason?: string;
  }): EmailTemplate => ({
    subject: `Order Update — ${order.id}`,
    html: baseEmailTemplate(`
      <h1>Order Update</h1>
      <p>Hello <span class="highlight">${order.shippingInfo.fullName}</span>,</p>
      <p>Your order <b>${order.id}</b> could not be approved.</p>
      <p>${order.rejectionReason || "Please contact the Nido Tech team for assistance."}</p>
    `),
    plainText: `Order ${order.id} was not approved. ${order.rejectionReason || ""}`,
  }),

  orderReceivedForOwner: (order: {
    id: string;
    orderDate: string;
    shippingInfo: { email: string; fullName: string; companyName?: string };
    items: Array<{ name: string; quantity: number; category?: string }>;
    total: number;
    paymentMethod: string;
    shippingMethod: string;
  }): EmailTemplate => ({
    subject: `New Client Order Received — ${order.id}`,
    html: baseEmailTemplate(`
      <h1>New Client Order Received</h1>
      <p>Hello <span class="highlight">Nido Team</span>,</p>
      <p>A new order <b>${order.id}</b> is awaiting procurement review.</p>
      <ul>${order.items.map((item) => `<li>${item.name} (Qty: ${item.quantity})</li>`).join("")}</ul>
      <p><b>Total:</b> ${formatCurrency(order.total)}</p>
      <p><b>Client:</b> ${order.shippingInfo.fullName} ${order.shippingInfo.companyName ? `(${order.shippingInfo.companyName})` : ""}</p>
    `),
    plainText: `New order ${order.id} received for ${formatCurrency(order.total)}.`,
  }),
};

export const sendEmail = async (
  to: string | string[],
  template: EmailTemplate,
): Promise<boolean> => {
  try {
    await apiRequest("/email/send", {
      method: "POST",
      body: {
        to: Array.isArray(to) ? to : [to],
        subject: template.subject,
        html: template.html,
        plainText: template.plainText,
      },
    });
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};
