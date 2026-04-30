/**
 * Production-Grade Email Template Generator
 * Generates beautiful, responsive HTML emails for SaaS platforms
 * Supports: Credentials, Orders, Approvals, Invoices
 */

const BRAND_COLOR = "#4F46E5";
const ACCENT_COLOR = "#10B981";
const DANGER_COLOR = "#EF4444";
const NEUTRAL_100 = "#F9FAFB";
const NEUTRAL_200 = "#F3F4F6";
const NEUTRAL_300 = "#E5E7EB";
const NEUTRAL_500 = "#6B7280";
const NEUTRAL_900 = "#111827";

/**
 * Email layout wrapper with brand styling
 */
const emailWrapper = (content, style = "") => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${style}</style>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f9fafb;">
  <div style="max-width:640px;margin:0 auto;">
    ${content}
  </div>
</body>
</html>
`;

/**
 * Header component
 */
const emailHeader = (title, subtitle = "") => `
<div style="background:linear-gradient(135deg,${BRAND_COLOR} 0%,#7c3aed 100%);color:white;padding:40px 24px;text-align:center;border-radius:12px 12px 0 0;">
  <div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;opacity:0.9;margin-bottom:12px;">
    <strong>Nido Tech</strong>
  </div>
  <h1 style="margin:0;font-size:28px;font-weight:700;line-height:1.2;">
    ${title}
  </h1>
  ${subtitle ? `<p style="margin:12px 0 0;opacity:0.95;font-size:14px;">${subtitle}</p>` : ""}
</div>
`;

/**
 * Card component for content sections
 */
const card = (content, padded = true) => `
<div style="background:white;${padded ? "padding:28px 24px;" : ""}border:1px solid ${NEUTRAL_300};border-radius:8px;">
  ${content}
</div>
`;

/**
 * Section title component
 */
const sectionTitle = (title) => `
<h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:${NEUTRAL_900};">
  ${title}
</h2>
`;

/**
 * Badge component
 */
const badge = (text, variant = "primary") => {
  const colors = {
    primary: { bg: BRAND_COLOR, fg: "white" },
    success: { bg: ACCENT_COLOR, fg: "white" },
    danger: { bg: DANGER_COLOR, fg: "white" },
    warning: { bg: "#F59E0B", fg: "white" },
    neutral: { bg: NEUTRAL_200, fg: NEUTRAL_900 },
  };
  const color = colors[variant] || colors.primary;
  return `
<span style="display:inline-block;background:${color.bg};color:${color.fg};padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
  ${text}
</span>
  `;
};

/**
 * Credential card
 */
const credentialField = (label, value, masked = false) => `
<div style="margin-bottom:14px;">
  <div style="font-size:11px;color:${NEUTRAL_500};text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:6px;">
    ${label}
  </div>
  <div style="background:${NEUTRAL_100};padding:12px 14px;border-radius:6px;border-left:3px solid ${BRAND_COLOR};font-family:'SF Mono',Monaco,'Cascadia Code',monospace;font-size:14px;font-weight:500;color:${NEUTRAL_900};word-break:break-all;">
    ${masked ? value.replace(/./g, "*").slice(0, -3) + value.slice(-3) : value}
  </div>
</div>
`;

/**
 * Data row
 */
const dataRow = (label, value, bold = false) => `
<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid ${NEUTRAL_200};${bold ? "font-weight:600;font-size:15px;" : ""}">
  <span style="color:${NEUTRAL_500};">${label}</span>
  <span style="color:${NEUTRAL_900};">${value}</span>
</div>
`;

/**
 * Product table row
 */
const productTableRow = (name, qty, price, category = "") => `
<tr style="border-bottom:1px solid ${NEUTRAL_200};">
  <td style="padding:14px 0;color:${NEUTRAL_900};">
    <strong>${name}</strong>
    ${category ? `<div style="font-size:12px;color:${NEUTRAL_500};">${category}</div>` : ""}
  </td>
  <td style="padding:14px 0;text-align:center;color:${NEUTRAL_600};">${qty}</td>
  <td style="padding:14px 0;text-align:right;color:${NEUTRAL_900};font-weight:600;">₹${Number(price).toLocaleString()}</td>
</tr>
`;

/**
 * CTA button
 */
const ctaButton = (text, url, variant = "primary") => {
  const bgColor = variant === "primary" ? BRAND_COLOR : NEUTRAL_500;
  return `
<a href="${url}" style="display:inline-block;background:${bgColor};color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin:16px 0;">
  ${text}
</a>
  `;
};

/**
 * Footer component
 */
const emailFooter = () => `
<div style="background:${NEUTRAL_100};padding:28px 24px;text-align:center;border-radius:0 0 12px 12px;font-size:12px;color:${NEUTRAL_500};">
  <div style="margin-bottom:12px;">
    <strong style="color:${NEUTRAL_900};">Need Help?</strong><br>
    Email: <a href="mailto:support@nidotech.com" style="color:${BRAND_COLOR};text-decoration:none;">support@nidotech.com</a>
  </div>
  <div style="margin-bottom:12px;">
    📞 +91-XXXX-XXX-XXX | 🌐 www.nidotech.com
  </div>
  <div style="padding-top:12px;border-top:1px solid ${NEUTRAL_300};margin-top:12px;opacity:0.8;">
    © 2026 Nido Tech. All rights reserved.
  </div>
</div>
`;

/**
 * TEMPLATE: User Credentials Email
 */
function credentialsEmailTemplate(data) {
  const {
    username,
    email,
    temporaryPassword,
    createdBy,
    userType = "User",
    loginUrl,
  } = data;

  const html = emailWrapper(
    `
    <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
      ${emailHeader("Welcome to Nido Tech", `Your account has been created by ${createdBy}`)}
      
      <div style="padding:28px 24px;">
        <p style="margin:0 0 20px;color:${NEUTRAL_500};line-height:1.6;">
          Your account is ready. Below are your login credentials. Please change your password after your first login.
        </p>
        
        ${sectionTitle("Login Details")}
        
        <div style="background:${NEUTRAL_100};padding:20px;border-radius:8px;margin-bottom:24px;border-left:4px solid ${ACCENT_COLOR};">
          ${credentialField("Username", username)}
          ${credentialField("Email Address", email)}
          ${credentialField("Temporary Password", temporaryPassword, true)}
        </div>
        
        <div style="background:#FEF3C7;border:1px solid #FCD34D;padding:16px;border-radius:8px;margin-bottom:24px;">
          <div style="font-weight:600;color:#92400E;margin-bottom:8px;">⚠️ Important Security Notice</div>
          <ul style="margin:0;padding-left:20px;color:#B45309;font-size:14px;">
            <li style="margin:4px 0;">You must change this temporary password on your first login</li>
            <li style="margin:4px 0;">This password expires in 24 hours</li>
            <li style="margin:4px 0;">Never share your credentials with anyone</li>
          </ul>
        </div>
        
        <div style="text-align:center;">
          ${ctaButton("Login Now", loginUrl)}
        </div>
        
        <div style="margin-top:28px;padding:20px;background:${NEUTRAL_100};border-radius:8px;font-size:13px;line-height:1.6;color:${NEUTRAL_600};">
          <strong>Next Steps:</strong><br>
          1️⃣ Login using credentials above<br>
          2️⃣ Change your password immediately<br>
          3️⃣ Complete your profile setup<br>
          4️⃣ Explore your dashboard
        </div>
      </div>
      
      ${emailFooter()}
    </div>
    <div style="height:20px;"></div>
    `,
  );

  return {
    subject: `Your Nido Tech Account Credentials - ${userType}`,
    html,
    text: `Login Details\nUsername: ${username}\nEmail: ${email}\nTemporary Password: ${temporaryPassword}\n\nPlease change this password on first login.\n\nLogin at: ${loginUrl}`,
  };
}

/**
 * TEMPLATE: Order Confirmation Email
 */
function orderConfirmationEmailTemplate(data) {
  const {
    orderNumber,
    orderDate,
    items = [],
    subtotal = 0,
    tax = 0,
    shippingCharges = 0,
    totalAmount = 0,
    clientName,
    clientEmail,
    organization,
    deliveryAddress,
    shippingMethod = "Standard",
    paymentMethod = "Credit Card",
  } = data;

  const formattedDate = new Date(orderDate).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = emailWrapper(
    `
    <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
      ${emailHeader("Order Confirmed", `Order #${orderNumber}`)}
      
      <div style="padding:28px 24px;">
        <p style="margin:0 0 20px;color:${NEUTRAL_500};line-height:1.6;">
          Thank you for placing your order. We've received it and it's now moving through our approval process.
        </p>
        
        ${badge("Pending Approval", "warning")}
        
        <div style="margin:24px 0;padding:16px;background:${NEUTRAL_100};border-radius:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <span style="color:${NEUTRAL_500};">Order Number</span>
            <strong>${orderNumber}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:${NEUTRAL_500};">Order Date</span>
            <strong>${formattedDate}</strong>
          </div>
        </div>
        
        ${sectionTitle("Order Details")}
        
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="border-bottom:2px solid ${NEUTRAL_300};">
              <th style="text-align:left;padding:12px 0;color:${NEUTRAL_600};font-weight:600;font-size:13px;">Product</th>
              <th style="text-align:center;padding:12px 0;color:${NEUTRAL_600};font-weight:600;font-size:13px;">Qty</th>
              <th style="text-align:right;padding:12px 0;color:${NEUTRAL_600};font-weight:600;font-size:13px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map((item) =>
                productTableRow(
                  item.name || item.description || "Item",
                  item.quantity || 0,
                  item.price || 0,
                  item.category || "",
                ),
              )
              .join("")}
          </tbody>
        </table>
        
        <div style="background:${NEUTRAL_100};padding:16px;border-radius:8px;margin-bottom:24px;">
          ${dataRow("Subtotal", `₹${Number(subtotal).toLocaleString()}`)}
          ${dataRow("Tax (GST)", `₹${Number(tax).toLocaleString()}`)}
          ${dataRow("Shipping", `₹${Number(shippingCharges).toLocaleString()}`)}
          ${dataRow("Total Amount", `₹${Number(totalAmount).toLocaleString()}`, true)}
        </div>
        
        ${sectionTitle("Delivery Details")}
        
        <div style="background:${NEUTRAL_100};padding:16px;border-radius:8px;margin-bottom:24px;font-size:14px;line-height:1.6;">
          <div><strong>${clientName}</strong></div>
          <div style="color:${NEUTRAL_600};">${organization || "Organization"}</div>
          <div style="margin-top:8px;color:${NEUTRAL_600};">${deliveryAddress || "No address provided"}</div>
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid ${NEUTRAL_300};">
            <strong>Shipping Method:</strong> ${shippingMethod}<br>
            <strong>Payment Method:</strong> ${paymentMethod}
          </div>
        </div>
        
        <div style="margin:24px 0;padding:16px;background:#F0F9FF;border-left:4px solid #0284C7;border-radius:8px;font-size:13px;color:${NEUTRAL_700};">
          <strong>What's Next?</strong><br>
          Your order will be reviewed and approved by our team. You'll receive an approval confirmation email shortly.
        </div>
      </div>
      
      ${emailFooter()}
    </div>
    <div style="height:20px;"></div>
    `,
  );

  return {
    subject: `Order Confirmation - ${orderNumber}`,
    html,
    text: `Order #${orderNumber} confirmed on ${formattedDate}. Total: ₹${Number(totalAmount).toLocaleString()}. Items: ${items.length}`,
  };
}

/**
 * TEMPLATE: Order Approval Email
 */
function orderApprovalEmailTemplate(data) {
  const {
    orderNumber,
    orderDate,
    approvedBy,
    items = [],
    totalAmount = 0,
  } = data;

  const formattedDate = new Date(orderDate).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = emailWrapper(
    `
    <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
      ${emailHeader("Order Approved ✓", `Order #${orderNumber} is ready to proceed`)}
      
      <div style="padding:28px 24px;">
        <p style="margin:0 0 20px;color:${NEUTRAL_500};line-height:1.6;">
          Great news! Your order has been approved and will be processed by our vendor team shortly.
        </p>
        
        ${badge("Approved", "success")}
        
        <div style="margin:24px 0;padding:16px;background:${NEUTRAL_100};border-radius:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <span style="color:${NEUTRAL_500};">Approved By</span>
            <strong>${approvedBy}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <span style="color:${NEUTRAL_500};">Order Number</span>
            <strong>${orderNumber}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:${NEUTRAL_500};">Total Amount</span>
            <strong style="font-size:16px;color:${BRAND_COLOR};">₹${Number(totalAmount).toLocaleString()}</strong>
          </div>
        </div>
        
        ${sectionTitle("Items in This Order")}
        
        <div style="background:${NEUTRAL_100};padding:16px;border-radius:8px;margin-bottom:24px;">
          ${items.map((item) => `<div style="padding:8px 0;border-bottom:1px solid ${NEUTRAL_300};display:flex;justify-content:space-between;"><span>${item.name || "Item"}</span><span style="color:${NEUTRAL_600};">×${item.quantity}</span></div>`).join("")}
        </div>
        
        <div style="margin:24px 0;padding:16px;background:#ECFDF5;border-left:4px solid ${ACCENT_COLOR};border-radius:8px;font-size:13px;color:#065F46;">
          <strong>Status Update:</strong><br>
          Your order is now in the vendor queue. You'll be notified when it's shipped.
        </div>
      </div>
      
      ${emailFooter()}
    </div>
    <div style="height:20px;"></div>
    `,
  );

  return {
    subject: `Order Approved - ${orderNumber}`,
    html,
    text: `Order #${orderNumber} has been approved. Total: ₹${Number(totalAmount).toLocaleString()}. Items: ${items.length}`,
  };
}

/**
 * TEMPLATE: Invoice Email
 */
function invoiceEmailTemplate(data) {
  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
    items = [],
    subtotal = 0,
    tax = 0,
    totalAmount = 0,
    clientName,
    clientEmail,
    organization,
    invoiceUrl,
  } = data;

  const formattedInvoiceDate = new Date(invoiceDate).toLocaleDateString(
    "en-IN",
    { year: "numeric", month: "long", day: "numeric" },
  );
  const formattedDueDate = new Date(dueDate).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = emailWrapper(
    `
    <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
      ${emailHeader("Invoice Ready", `Invoice #${invoiceNumber}`)}
      
      <div style="padding:28px 24px;">
        <p style="margin:0 0 20px;color:${NEUTRAL_500};line-height:1.6;">
          Your invoice is ready. Please review the details below and make payment by the due date.
        </p>
        
        <div style="margin:24px 0;padding:16px;background:${NEUTRAL_100};border-radius:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <span style="color:${NEUTRAL_500};">Invoice Number</span>
            <strong>${invoiceNumber}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <span style="color:${NEUTRAL_500};">Invoice Date</span>
            <strong>${formattedInvoiceDate}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:${NEUTRAL_500};">Due Date</span>
            <strong>${formattedDueDate}</strong>
          </div>
        </div>
        
        ${sectionTitle("Billed To")}
        
        <div style="background:${NEUTRAL_100};padding:16px;border-radius:8px;margin-bottom:24px;font-size:14px;line-height:1.6;">
          <strong>${clientName}</strong><br>
          ${organization || "Organization"}<br>
          ${clientEmail}
        </div>
        
        ${sectionTitle("Invoice Items")}
        
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="border-bottom:2px solid ${NEUTRAL_300};">
              <th style="text-align:left;padding:12px 0;color:${NEUTRAL_600};font-weight:600;font-size:13px;">Description</th>
              <th style="text-align:center;padding:12px 0;color:${NEUTRAL_600};font-weight:600;font-size:13px;">Qty</th>
              <th style="text-align:right;padding:12px 0;color:${NEUTRAL_600};font-weight:600;font-size:13px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map((item) =>
                productTableRow(
                  item.description || item.name || "Item",
                  item.quantity || 0,
                  item.amount || 0,
                ),
              )
              .join("")}
          </tbody>
        </table>
        
        <div style="background:${NEUTRAL_100};padding:16px;border-radius:8px;margin-bottom:24px;">
          ${dataRow("Subtotal", `₹${Number(subtotal).toLocaleString()}`)}
          ${dataRow("Tax (GST)", `₹${Number(tax).toLocaleString()}`)}
          ${dataRow("Total Due", `₹${Number(totalAmount).toLocaleString()}`, true)}
        </div>
        
        <div style="text-align:center;">
          ${ctaButton("View Full Invoice", invoiceUrl)}
        </div>
        
        <div style="margin:24px 0;padding:16px;background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:8px;font-size:13px;color:#92400E;">
          <strong>Payment Instructions:</strong><br>
          Please complete your payment by ${formattedDueDate}. Late payments may incur additional charges.
        </div>
      </div>
      
      ${emailFooter()}
    </div>
    <div style="height:20px;"></div>
    `,
  );

  return {
    subject: `Invoice ${invoiceNumber} - Due by ${formattedDueDate}`,
    html,
    text: `Invoice #${invoiceNumber} for ₹${Number(totalAmount).toLocaleString()}. Due: ${formattedDueDate}`,
  };
}

/**
 * MAIN EXPORT: Template Generator
 */
export function generateEmailTemplate(type, data) {
  const templates = {
    credentials: credentialsEmailTemplate,
    order: orderConfirmationEmailTemplate,
    approval: orderApprovalEmailTemplate,
    invoice: invoiceEmailTemplate,
  };

  const generator = templates[type];
  if (!generator) {
    throw new Error(`Unknown email template type: ${type}`);
  }

  return generator(data);
}

/**
 * Export individual templates for direct use
 */
export {
  credentialsEmailTemplate,
  orderConfirmationEmailTemplate,
  orderApprovalEmailTemplate,
  invoiceEmailTemplate,
};
