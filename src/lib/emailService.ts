/**
 * Email Service - Professional email composition and sending simulation
 * In production, integrate with services like SendGrid, AWS SES, or similar
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  plainText: string;
}

export const emailTemplates = {
  orderConfirmation: (order: {
    id: string;
    shippingInfo: { email: string; fullName: string };
    items: any[];
    total: number;
    orderDate: string;
  }): EmailTemplate => ({
    subject: `Order Confirmation - ${order.id}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { background: linear-gradient(to right, #10b981, #059669); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .order-number { font-size: 14px; opacity: 0.9; margin-top: 5px; }
            .section { margin: 20px 0; }
            .section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; border-bottom: 2px solid #10b981; padding-bottom: 8px; }
            .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .item-name { font-weight: 500; }
            .item-price { color: #10b981; font-weight: bold; }
            .summary { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .summary-total { font-size: 18px; font-weight: bold; color: #10b981; border-top: 2px solid #e5e7eb; padding-top: 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Order Confirmed!</h1>
              <div class="order-number">Order # ${order.id}</div>
            </div>

            <p>Dear ${order.shippingInfo.fullName},</p>
            <p>Thank you for your order! We're delighted to confirm that your order has been received and is being processed.</p>

            <div class="section">
              <div class="section-title">Order Details</div>
              <div class="summary-row">
                <span>Order Date:</span>
                <span>${new Date(order.orderDate).toLocaleDateString()}</span>
              </div>
              <div class="summary-row">
                <span>Order ID:</span>
                <span>${order.id}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Order Items (${order.items.length})</div>
              ${order.items
                .map(
                  (item: any) => `
                <div class="order-item">
                  <span class="item-name">${item.name} x${item.quantity}</span>
                  <span class="item-price">$${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              `,
                )
                .join("")}
            </div>

            <div class="summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>$${order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0).toLocaleString()}</span>
              </div>
              <div class="summary-row">
                <span>Shipping & Handling:</span>
                <span>$25.00</span>
              </div>
              <div class="summary-row">
                <span>Tax:</span>
                <span>$${(order.total * 0.1).toLocaleString()}</span>
              </div>
              <div class="summary-row summary-total">
                <span>Total:</span>
                <span>$${order.total.toLocaleString()}</span>
              </div>
            </div>

            <div class="section">
              <p>Your order will be processed and prepared for shipment shortly. You will receive a tracking number via email once your items ship.</p>
            </div>

            <div class="footer">
              <p>© 2026 Nido Tech Corporessentials. All rights reserved.</p>
              <p>If you have any questions, please contact us at support@nidotech.com</p>
            </div>
          </div>
        </body>
      </html>
    `,
    plainText: `
Order Confirmation - ${order.id}

Dear ${order.shippingInfo.fullName},

Thank you for your order! Your order ID is ${order.id}.

Order Date: ${new Date(order.orderDate).toLocaleDateString()}

Items:
${order.items.map((item: any) => `${item.name} x${item.quantity} - $${(item.price * item.quantity).toLocaleString()}`).join("\n")}

Total: $${order.total.toLocaleString()}

Your order will be processed shortly. You will receive tracking information via email.

Thank you for shopping with us!
    `.trim(),
  }),

  orderApproved: (order: {
    id: string;
    shippingInfo: { email: string; fullName: string };
    total: number;
  }): EmailTemplate => ({
    subject: `Order Approved - ${order.id}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { background: linear-gradient(to right, #10b981, #059669); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .icon { font-size: 48px; margin-bottom: 10px; }
            .status-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 6px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">✅</div>
              <h1>Order Approved</h1>
            </div>

            <p>Dear ${order.shippingInfo.fullName},</p>
            <p>Great news! Your order <strong>${order.id}</strong> has been approved by our team.</p>

            <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 6px;">
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Status:</strong> <span class="status-badge">APPROVED</span></p>
              <p><strong>Total Amount:</strong> $${order.total.toLocaleString()}</p>
            </div>

            <p>Your order is now in processing and will be prepared for shipment soon. You will receive a shipping notification with tracking details shortly.</p>

            <div class="footer">
              <p>© 2026 Nido Tech Corporessentials. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    plainText: `
Order Approved - ${order.id}

Dear ${order.shippingInfo.fullName},

Great news! Your order ${order.id} has been approved.

Status: APPROVED
Total Amount: $${order.total.toLocaleString()}

Your order is now in processing. You will receive shipping details shortly.

Thank you!
    `.trim(),
  }),

  orderRejected: (order: {
    id: string;
    shippingInfo: { email: string; fullName: string };
    rejectionReason?: string;
  }): EmailTemplate => ({
    subject: `Order Update - ${order.id}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { background: linear-gradient(to right, #ef4444, #dc2626); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .icon { font-size: 48px; margin-bottom: 10px; }
            .alert-box { background: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 6px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">⚠️</div>
              <h1>Order Requires Attention</h1>
            </div>

            <p>Dear ${order.shippingInfo.fullName},</p>
            <p>We regret to inform you that your order <strong>${order.id}</strong> could not be processed at this time.</p>

            ${
              order.rejectionReason
                ? `
            <div class="alert-box">
              <p><strong>Reason:</strong></p>
              <p>${order.rejectionReason}</p>
            </div>
            `
                : ""
            }

            <p>Please contact our support team to discuss alternative solutions or place a new order.</p>

            <div class="footer">
              <p>© 2026 Nido Tech Corporessentials. All rights reserved.</p>
              <p>Email: support@nidotech.com | Phone: (123) 456-7890</p>
            </div>
          </div>
        </body>
      </html>
    `,
    plainText: `
Order Update - ${order.id}

Dear ${order.shippingInfo.fullName},

We regret to inform you that your order ${order.id} could not be processed.

${order.rejectionReason ? `Reason: ${order.rejectionReason}` : ""}

Please contact our support team for assistance.

Support: support@nidotech.com | (123) 456-7890
    `.trim(),
  }),
};

/**
 * Simulate sending an email
 * In production, replace with actual email service API call
 */
export const sendEmail = async (
  to: string,
  template: EmailTemplate,
): Promise<boolean> => {
  try {
    // Log email sending (in production, actually send via email service)
    console.log(`📧 Email sent to: ${to}`);
    console.log(`Subject: ${template.subject}`);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Store in localStorage for audit trail
    const emailLog = JSON.parse(localStorage.getItem("nido_email_log") || "[]");
    emailLog.push({
      id: `email-${Date.now()}`,
      to,
      subject: template.subject,
      sentAt: new Date().toISOString(),
      status: "sent",
    });
    localStorage.setItem("nido_email_log", JSON.stringify(emailLog));

    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};
