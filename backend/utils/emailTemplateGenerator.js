const safe = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export const baseEmailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {
    margin: 0;
    padding: 0;
    background-color: #f4f7fb;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  }

  .wrapper {
    width: 100%;
    padding: 40px 0;
    background-color: #f4f7fb;
  }

  .container {
    max-width: 600px;
    margin: auto;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(0,0,0,0.08);
  }

  .header {
    background: linear-gradient(135deg, #2c4a6e, #1e3a5f);
    padding: 24px;
    color: white;
    font-size: 20px;
    font-weight: 600;
    text-align: center;
  }

  .content {
    padding: 32px;
    color: #333;
    font-size: 15px;
    line-height: 1.7;
  }

  h1 {
    font-size: 22px;
    margin-bottom: 16px;
    color: #111;
  }

  p {
    margin: 12px 0;
  }

  .highlight {
    font-weight: 600;
    color: #2c4a6e;
  }

  .button {
    display: inline-block;
    margin-top: 20px;
    padding: 14px 24px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white !important;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
  }

  .link {
    color: #2563eb;
    word-break: break-all;
  }

  .card {
    margin: 18px 0;
    padding: 16px 18px;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .label {
    display: block;
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #64748b;
  }

  .mono {
    font-family: "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 14px;
    color: #0f172a;
  }

  ul {
    padding-left: 18px;
    margin: 10px 0 14px;
  }

  li {
    margin: 6px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 18px 0;
  }

  th, td {
    padding: 10px 0;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th:last-child,
  td:last-child {
    text-align: right;
  }

  .footer {
    text-align: center;
    font-size: 12px;
    color: #777;
    padding: 20px;
    background: #f1f5f9;
  }

  @media only screen and (max-width: 640px) {
    .wrapper {
      padding: 20px 12px;
    }
    .content {
      padding: 24px 20px;
    }
    .button {
      display: block;
      text-align: center;
    }
  }
</style>
</head>

<body>
  <div class="wrapper">
    <div class="container">

      <div class="header">
        Nido Tech CorpEssentials
      </div>

      <div class="content">
        ${content}
      </div>

      <div class="footer">
        © 2026 Nido Tech. All rights reserved.<br/>
        support@nido.com
      </div>

    </div>
  </div>
</body>
</html>
`;

export const userInviteTemplate = ({
  name,
  link,
  username = "",
  email = "",
  temporaryPassword = "",
  roleLabel = "",
}) =>
  baseEmailTemplate(`
  <h1>Welcome to Nido Tech</h1>

  <p>Hello <span class="highlight">${safe(name)}</span>,</p>

  <p>
    You have been invited to join <b>Nido Tech CorpEssentials</b>.
    Click below to set up your account and create your password.
  </p>

  ${
    username || email || temporaryPassword
      ? `
    <div class="card">
      ${username ? `<span class="label">Username</span><div class="mono">${safe(username)}</div>` : ""}
      ${email ? `<span class="label" style="margin-top:12px;">Email</span><div class="mono">${safe(email)}</div>` : ""}
      ${temporaryPassword ? `<span class="label" style="margin-top:12px;">Temporary Password</span><div class="mono">${safe(temporaryPassword)}</div>` : ""}
      ${roleLabel ? `<span class="label" style="margin-top:12px;">Access Role</span><div>${safe(roleLabel)}</div>` : ""}
    </div>
  `
      : ""
  }

  <a href="${safe(link)}" class="button">Set Up Your Account</a>

  <p>
    Invitation link:<br/>
    <span class="link">${safe(link)}</span>
  </p>

  <p>This link will expire in 7 days.</p>

  <p>If you did not expect this, you can ignore this email.</p>

  <p>— Nido Tech Team</p>
`);

export const orderTemplate = ({
  name,
  orderId,
  items = [],
  total = 0,
  title = "Order Confirmation",
  intro = "Your order has been placed successfully.",
}) =>
  baseEmailTemplate(`
  <h1>${safe(title)}</h1>

  <p>Hello <span class="highlight">${safe(name)}</span>,</p>

  <p>${safe(intro)} <b>${safe(orderId)}</b>.</p>

  <p><b>Items:</b></p>
  <ul>
    ${items
      .map(
        (item) =>
          `<li>${safe(item.name || "Item")} (Qty: ${safe(item.quantity || 0)})</li>`,
      )
      .join("")}
  </ul>

  <div class="card">
    <span class="label">Total</span>
    <div class="mono">${formatMoney(total)}</div>
  </div>

  <p>We will notify you once it is approved and processed.</p>
`);

export const orderApprovalTemplate = ({
  name,
  orderId,
  approvedBy,
  items = [],
  total = 0,
}) =>
  baseEmailTemplate(`
  <h1>Order Approved</h1>

  <p>Hello <span class="highlight">${safe(name)}</span>,</p>

  <p>Your order <b>${safe(orderId)}</b> has been approved by <b>${safe(approvedBy)}</b>.</p>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item) => `
        <tr>
          <td>${safe(item.name || "Item")}</td>
          <td>${safe(item.quantity || 0)}</td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <div class="card">
    <span class="label">Confirmed Total</span>
    <div class="mono">${formatMoney(total)}</div>
  </div>

  <p>Your order is now moving into vendor assignment and fulfillment.</p>
`);

export const invoiceTemplate = ({
  name,
  invoiceNumber,
  items = [],
  subtotal = 0,
  tax = 0,
  total = 0,
  dueDate = "",
  invoiceUrl = "",
}) =>
  baseEmailTemplate(`
  <h1>Invoice Ready</h1>

  <p>Hello <span class="highlight">${safe(name)}</span>,</p>

  <p>Your invoice <b>${safe(invoiceNumber)}</b> is ready for review.</p>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item) => `
        <tr>
          <td>${safe(item.description || item.name || "Item")} (Qty: ${safe(item.quantity || 0)})</td>
          <td>${formatMoney(item.total || item.amount || 0)}</td>
        </tr>
      `,
        )
        .join("")}
      <tr>
        <td><b>Subtotal</b></td>
        <td><b>${formatMoney(subtotal)}</b></td>
      </tr>
      <tr>
        <td><b>Tax</b></td>
        <td><b>${formatMoney(tax)}</b></td>
      </tr>
      <tr>
        <td><b>Total</b></td>
        <td><b>${formatMoney(total)}</b></td>
      </tr>
    </tbody>
  </table>

  ${invoiceUrl ? `<a href="${safe(invoiceUrl)}" class="button">View Invoice</a>` : ""}

  ${dueDate ? `<p>Payment due date: <b>${safe(dueDate)}</b></p>` : ""}
`);

export function generateEmailTemplate(type, data = {}) {
  switch (type) {
    case "credentials":
      return {
        subject: "Complete your Nido Tech account setup",
        html: userInviteTemplate({
          name: data.name || data.username || "User",
          link: data.setupLink || data.loginUrl || process.env.FRONTEND_URL || "",
          username: data.username,
          email: data.email,
          temporaryPassword: data.temporaryPassword,
          roleLabel: data.userType || data.roleLabel || "",
        }),
        text: `Welcome to Nido Tech. Complete your setup: ${data.setupLink || data.loginUrl || ""}`,
      };
    case "order":
      return {
        subject: `Order Confirmation - ${data.orderNumber || data.orderId || ""}`,
        html: orderTemplate({
          name: data.clientName || data.name || "Customer",
          orderId: data.orderNumber || data.orderId || "",
          items: data.items || [],
          total: data.totalAmount || data.total || 0,
        }),
        text: `Order confirmation for ${data.orderNumber || data.orderId || ""}`,
      };
    case "approval":
      return {
        subject: `Order Approved - ${data.orderNumber || data.orderId || ""}`,
        html: orderApprovalTemplate({
          name: data.clientName || data.name || "Customer",
          orderId: data.orderNumber || data.orderId || "",
          approvedBy: data.approvedBy || "Nido Tech",
          items: data.items || [],
          total: data.totalAmount || data.total || 0,
        }),
        text: `Order approved: ${data.orderNumber || data.orderId || ""}`,
      };
    case "invoice":
      return {
        subject: `Invoice ${data.invoiceNumber || ""}`,
        html: invoiceTemplate({
          name: data.clientName || data.name || "Customer",
          invoiceNumber: data.invoiceNumber || "",
          items: data.items || [],
          subtotal: data.subtotal || 0,
          tax: data.tax || 0,
          total: data.totalAmount || data.total || 0,
          dueDate: data.dueDate || "",
          invoiceUrl: data.invoiceUrl || "",
        }),
        text: `Invoice ${data.invoiceNumber || ""} is ready.`,
      };
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
}
