const money = (value) => Number(value || 0).toLocaleString();

const renderRows = (items = []) =>
  items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${item.name || item.description || "Item"}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity || 0}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">${money(item.totalCost || item.total || 0)}</td>
        </tr>
      `,
    )
    .join("");

export const orderPlacedTemplate = (order) => ({
  subject: `Order Confirmation - ${order.orderNumber}`,
  html: `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:720px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#1e3a8a,#0f766e);color:#fff;padding:24px 28px;">
          <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.8;">Nido Tech</div>
          <h1 style="margin:8px 0 0;font-size:26px;">Order Received</h1>
          <div style="margin-top:6px;opacity:.9;">${order.orderNumber}</div>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 16px;color:#334155;">Thank you for your order. The request has been recorded and is now moving through approval.</p>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr><th style="text-align:left;padding:10px;border-bottom:2px solid #e2e8f0;">Item</th><th style="text-align:center;padding:10px;border-bottom:2px solid #e2e8f0;">Qty</th><th style="text-align:right;padding:10px;border-bottom:2px solid #e2e8f0;">Amount</th></tr>
            </thead>
            <tbody>${renderRows(order.items)}</tbody>
          </table>
          <div style="margin-top:18px;padding:16px;background:#f8fafc;border-radius:12px;">
            <div style="display:flex;justify-content:space-between;margin:6px 0;"><span>Shipping</span><span>${money(order.shippingCharges || 0)}</span></div>
            <div style="display:flex;justify-content:space-between;margin:6px 0;font-weight:700;font-size:16px;"><span>Total</span><span>${money(order.totalAmount)}</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
  text: `Order received: ${order.orderNumber} | Total: ${money(order.totalAmount)}`,
});

export const orderApprovedTemplate = (order) => ({
  subject: `Order Approved - ${order.orderNumber}`,
  html: `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:720px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e2e8f0;">
        <h1 style="margin:0 0 12px;color:#0f172a;">Order Approved</h1>
        <p style="color:#334155;">Your order ${order.orderNumber} has been approved and moved to placed status.</p>
        <p style="font-weight:700;">Total: ${money(order.totalAmount)}</p>
      </div>
    </div>
  `,
  text: `Order approved: ${order.orderNumber}`,
});

export const invoiceEmailTemplate = (invoice) => ({
  subject: `Invoice ${invoice.invoiceNumber}`,
  html: `<div style="font-family:Arial,sans-serif;padding:24px;"><h1>Invoice ${invoice.invoiceNumber}</h1><p>Total: ${money(invoice.total)}</p></div>`,
  text: `Invoice ${invoice.invoiceNumber} | Total: ${money(invoice.total)}`,
});

export const userCredentialsTemplate = ({
  name,
  username,
  email,
  temporaryPassword,
}) => ({
  subject: "Your Account Credentials",
  html: `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1e3a8a,#0f766e);color:#fff;padding:24px 28px;">
          <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.8;">Nido Tech</div>
          <h1 style="margin:8px 0 0;font-size:26px;">Account Created</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 16px;color:#334155;">Hello ${name || "User"}, your account is ready.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:700;">Username</td><td style="padding:10px;border-bottom:1px solid #e2e8f0;">${username}</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:700;">Email</td><td style="padding:10px;border-bottom:1px solid #e2e8f0;">${email}</td></tr>
            <tr><td style="padding:10px;font-weight:700;">Temporary Password</td><td style="padding:10px;">${temporaryPassword}</td></tr>
          </table>
          <p style="margin-top:16px;color:#475569;">You will be prompted to reset your password on first login.</p>
        </div>
      </div>
    </div>
  `,
  text: `Username: ${username}\nEmail: ${email}\nTemporary Password: ${temporaryPassword}`,
});
