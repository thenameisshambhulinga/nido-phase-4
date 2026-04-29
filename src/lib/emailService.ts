/**
 * Email Service — Frontend client for backend email API
 * Templates are generated here; actual sending goes through /api/email/send
 */

import { apiRequest } from "@/lib/api";

export interface EmailTemplate {
  subject: string;
  html: string;
  plainText: string;
}

export const emailTemplates = {
  orderConfirmation: (order: {
    id: string;
    shippingInfo: {
      email: string;
      fullName: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      category?: string;
    }>;
    total: number;
    orderDate: string;
    paymentMethod?: string;
    shippingMethod?: string;
    billingAddress?: string;
    shippingAddress?: string;
  }): EmailTemplate => {
    const itemsHtml = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;">${item.name}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">$${(item.price * item.quantity).toLocaleString()}</td>
          </tr>
        `,
      )
      .join("");

    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const tax = subtotal * 0.1;
    const shipping = subtotal > 500 ? 0 : 25;

    return {
      subject: `Order Confirmation — ${order.id}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 24px; }
              .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
              .header { background: linear-gradient(120deg, #1e3a5f, #2563eb); color: white; padding: 28px 32px; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
              .header p { margin: 6px 0 0; opacity: 0.9; font-size: 13px; }
              .content { padding: 28px 32px; }
              .section-title { font-size: 14px; font-weight: 700; color: #1e3a5f; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 0.08em; }
              .meta { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
              .meta-row { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; }
              .meta-row span:first-child { color: #64748b; }
              .meta-row span:last-child { font-weight: 600; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background: #f1f5f9; text-align: left; font-size: 12px; color: #475569; padding: 10px; border-bottom: 2px solid #e2e8f0; }
              td { padding: 10px; font-size: 13px; }
              .summary { background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 16px; }
              .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
              .summary-total { font-size: 16px; font-weight: 700; color: #1e3a5f; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 6px; }
              .footer { background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 16px 20px; text-align: center; font-size: 12px; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✓ Order Confirmed</h1>
                <p>Order ${order.id} &bull; ${new Date(order.orderDate).toLocaleDateString()}</p>
              </div>
              <div class="content">
                <p style="color:#334155;line-height:1.6;">Dear ${order.shippingInfo.fullName},</p>
                <p style="color:#334155;line-height:1.6;">Thank you for your order! We're delighted to confirm that your order has been received and is being processed.</p>

                <div class="section-title">Order Details</div>
                <div class="meta">
                  <div class="meta-row"><span>Order ID</span><span>${order.id}</span></div>
                  <div class="meta-row"><span>Order Date</span><span>${new Date(order.orderDate).toLocaleString()}</span></div>
                  <div class="meta-row"><span>Payment Method</span><span>${order.paymentMethod || "N/A"}</span></div>
                  <div class="meta-row"><span>Shipping Method</span><span>${order.shippingMethod || "N/A"}</span></div>
                </div>

                <div class="section-title">Shipping Address</div>
                <div class="meta">
                  <p style="margin:0;font-size:13px;color:#334155;">${order.shippingInfo.fullName}</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#334155;">${order.shippingAddress || `${order.shippingInfo.address || ""}, ${order.shippingInfo.city || ""}, ${order.shippingInfo.state || ""} ${order.shippingInfo.zipCode || ""}`}</p>
                </div>

                <div class="section-title">Items Ordered</div>
                <table>
                  <thead>
                    <tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Amount</th></tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <div class="summary">
                  <div class="summary-row"><span>Subtotal</span><span>$${subtotal.toLocaleString()}</span></div>
                  <div class="summary-row"><span>Tax (10%)</span><span>$${tax.toLocaleString()}</span></div>
                  <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? "Free" : "$" + shipping.toLocaleString()}</span></div>
                  <div class="summary-row summary-total"><span>Total</span><span>$${order.total.toLocaleString()}</span></div>
                </div>

                <p style="color:#334155;line-height:1.6;margin-top:20px;">Your order will be processed and prepared for shipment shortly. You will receive a tracking number via email once your items ship.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Nido Tech. All rights reserved.</p>
                <p>Questions? Contact us at support@nidotech.com</p>
              </div>
            </div>
          </body>
        </html>
      `,
      plainText: `
Order Confirmation — ${order.id}

Dear ${order.shippingInfo.fullName},

Thank you for your order! Your order has been received and is being processed.

Order Date: ${new Date(order.orderDate).toLocaleDateString()}
Order ID: ${order.id}
Payment Method: ${order.paymentMethod || "N/A"}
Shipping Method: ${order.shippingMethod || "N/A"}

Items:
${order.items.map((item) => `- ${item.name} x${item.quantity} = $${(item.price * item.quantity).toLocaleString()}`).join("\n")}

Total: $${order.total.toLocaleString()}

Your order will be processed shortly. You will receive tracking information via email.

Thank you for shopping with us!
&copy; 2026 Nido Tech
      `.trim(),
    };
  },

  orderApproved: (order: {
    id: string;
    shippingInfo: { email: string; fullName: string };
    total: number;
  }): EmailTemplate => ({
    subject: `Order Approved — ${order.id}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; }
          .header { background: linear-gradient(to right, #10b981, #059669); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .status-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 6px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>Order Approved</h1></div>
            <p>Dear ${order.shippingInfo.fullName},</p>
            <p>Great news! Your order <strong>${order.id}</strong> has been approved by our team.</p>
            <div style="background:#f0fdf4;padding:15px;border-left:4px solid #10b981;margin:20px 0;border-radius:6px;">
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Status:</strong> <span class="status-badge">APPROVED</span></p>
              <p><strong>Total Amount:</strong> $${order.total.toLocaleString()}</p>
            </div>
            <p>Your order is now in processing and will be prepared for shipment soon.</p>
            <div class="footer"><p>&copy; 2026 Nido Tech. All rights reserved.</p></div>
          </div>
        </body>
      </html>
    `,
    plainText: `
Order Approved — ${order.id}

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
    subject: `Order Update — ${order.id}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; }
          .header { background: linear-gradient(to right, #ef4444, #dc2626); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .alert-box { background: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 6px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>Order Requires Attention</h1></div>
            <p>Dear ${order.shippingInfo.fullName},</p>
            <p>We regret to inform you that your order <strong>${order.id}</strong> could not be processed at this time.</p>
            ${order.rejectionReason ? `<div class="alert-box"><p><strong>Reason:</strong></p><p>${order.rejectionReason}</p></div>` : ""}
            <p>Please contact our support team to discuss alternative solutions.</p>
            <div class="footer"><p>&copy; 2026 Nido Tech. All rights reserved.</p><p>Email: support@nidotech.com</p></div>
          </div>
        </body>
      </html>
    `,
    plainText: `
Order Update — ${order.id}

Dear ${order.shippingInfo.fullName},

We regret to inform you that your order ${order.id} could not be processed.

${order.rejectionReason ? `Reason: ${order.rejectionReason}` : ""}

Please contact our support team for assistance.

Support: support@nidotech.com
    `.trim(),
  }),

  orderReceivedForOwner: (order: {
    id: string;
    orderDate: string;
    shippingInfo: { email: string; fullName: string; companyName?: string };
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      category?: string;
    }>;
    total: number;
    paymentMethod: string;
    shippingMethod: string;
  }): EmailTemplate => {
    const itemsHtml = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #edf2f7;">${item.name}</td>
            <td style="padding:10px;border-bottom:1px solid #edf2f7;">${item.category || "General"}</td>
            <td style="padding:10px;border-bottom:1px solid #edf2f7;text-align:center;">${item.quantity}</td>
            <td style="padding:10px;border-bottom:1px solid #edf2f7;text-align:right;">$${(item.price * item.quantity).toLocaleString()}</td>
          </tr>
        `,
      )
      .join("");

    return {
      subject: `New Client Order Received — ${order.id}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { margin: 0; padding: 24px; background: #eef3fa; font-family: "Segoe UI", Arial, sans-serif; color: #1e293b; }
              .shell { max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #d9e2f1; border-radius: 14px; overflow: hidden; }
              .hero { background: linear-gradient(120deg, #1e3a5f, #2b4f7d); padding: 24px 28px; color: #f8fafc; }
              .hero h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.01em; }
              .hero p { margin: 8px 0 0; font-size: 13px; opacity: 0.92; }
              .content { padding: 26px 28px; }
              .tag { display: inline-block; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 600; }
              .title { margin: 18px 0 8px; font-size: 22px; color: #0f172a; }
              .lead { margin: 0 0 18px; color: #475569; line-height: 1.55; }
              .meta { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin: 16px 0 20px; }
              .meta-row { display: flex; justify-content: space-between; gap: 16px; font-size: 13px; padding: 6px 0; }
              .meta-row span:first-child { color: #64748b; }
              .meta-row span:last-child { font-weight: 600; color: #0f172a; text-align: right; }
              .table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
              .table th { background: #f1f5f9; text-align: left; font-size: 12px; color: #334155; padding: 10px; border-bottom: 1px solid #e2e8f0; }
              .table td { padding: 10px; font-size: 13px; border-bottom: 1px solid #edf2f7; }
              .table tr:last-child td { border-bottom: none; }
              .right { text-align: right; }
              .cta { margin: 20px 0 8px; text-align: center; }
              .cta a { display: inline-block; padding: 12px 26px; border-radius: 10px; background: linear-gradient(120deg, #2563eb, #1d4ed8); color: white; text-decoration: none; font-weight: 600; }
              .footer { background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 16px 20px; text-align: center; font-size: 12px; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="shell">
              <div class="hero">
                <h1>Nido Tech</h1>
                <p>Order Intelligence Notification</p>
              </div>
              <div class="content">
                <span class="tag">New Order Received</span>
                <h2 class="title">Order ${order.id} is now awaiting procurement review</h2>
                <p class="lead">A client has submitted a checkout request. You can now review, approve/reject, and proceed with vendor assignment from the procurement queue.</p>

                <div class="meta">
                  <div class="meta-row"><span>Order ID</span><span>${order.id}</span></div>
                  <div class="meta-row"><span>Order Date</span><span>${new Date(order.orderDate).toLocaleString()}</span></div>
                  <div class="meta-row"><span>Client Name</span><span>${order.shippingInfo.fullName}</span></div>
                  <div class="meta-row"><span>Client Email</span><span>${order.shippingInfo.email}</span></div>
                  <div class="meta-row"><span>Organization</span><span>${order.shippingInfo.companyName || "Client Organization"}</span></div>
                  <div class="meta-row"><span>Payment Method</span><span>${order.paymentMethod}</span></div>
                  <div class="meta-row"><span>Shipping Method</span><span>${order.shippingMethod}</span></div>
                </div>

                <table class="table" role="presentation">
                  <thead>
                    <tr><th>Item</th><th>Category</th><th class="right">Qty</th><th class="right">Amount</th></tr>
                  </thead>
                  <tbody>${itemsHtml}</tbody>
                </table>

                <div class="meta" style="margin-top: 14px;">
                  <div class="meta-row"><span>Order Total</span><span>$${order.total.toLocaleString()}</span></div>
                </div>

                <div class="cta">
                  <a href="https://app.nidotech.com/orders">Review in Procurement Workspace</a>
                </div>
              </div>
              <div class="footer">
                &copy; 2026 Nido Tech. All rights reserved. This is a system-generated operational notification.
              </div>
            </div>
          </body>
        </html>
      `,
      plainText: `
New Client Order Received — ${order.id}

Order ${order.id} was submitted and is awaiting procurement review.

Order Date: ${new Date(order.orderDate).toLocaleString()}
Client: ${order.shippingInfo.fullName}
Client Email: ${order.shippingInfo.email}
Organization: ${order.shippingInfo.companyName || "Client Organization"}
Payment Method: ${order.paymentMethod}
Shipping Method: ${order.shippingMethod}

Items:
${order.items.map((item) => `- ${item.name} (${item.category || "General"}) x${item.quantity} = $${(item.price * item.quantity).toLocaleString()}`).join("\n")}

Total: $${order.total.toLocaleString()}

Open Procurement Workspace to review this order.
      `.trim(),
    };
  },
};

/**
 * Send an email via the backend API
 */
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
        text: template.plainText,
      },
    });
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};
