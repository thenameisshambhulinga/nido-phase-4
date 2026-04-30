/**
 * INTEGRATION EXAMPLES
 * Shows how to use the production-grade email system
 */

// ============================================================================
// 1. USER CREATION - Send Credentials Email
// ============================================================================

/**
 * Backend (auth.js):
 * When creating a new user, credentials email is sent automatically
 */
export const createUserExample = async () => {
  // This is done automatically in POST /api/auth/users
  const newUser = {
    name: "John Doe",
    email: "john@company.com",
    role: "CLIENT_ADMIN",
  };

  // Backend automatically sends:
  // sendEmail({
  //   to: newUser.email,
  //   type: "credentials",
  //   data: {
  //     username: "john_doe",
  //     email: "john@company.com",
  //     temporaryPassword: "TempPwd123!@#",
  //     createdBy: "System Owner",
  //     userType: "Client Admin",
  //     loginUrl: "http://localhost:8080/login"
  //   },
  //   async: true
  // });
};

// ============================================================================
// 2. ORDER CONFIRMATION - Send Order Email After Placement
// ============================================================================

/**
 * Frontend (CheckoutPage.tsx):
 * Send order confirmation after successful order creation
 */
export const orderConfirmationExample = async () => {
  const order = {
    orderNumber: "ORD-2024-001234",
    orderDate: new Date().toISOString(),
    items: [
      { name: "Laptop", category: "Electronics", quantity: 2, price: 50000 },
      { name: "Mouse", category: "Accessories", quantity: 5, price: 500 },
    ],
    subtotal: 102500,
    tax: 15375,
    shippingCharges: 500,
    totalAmount: 118375,
    clientName: "Acme Corp",
    clientEmail: "procurement@acme.com",
    organization: "Acme Corporation",
    deliveryAddress: "123 Business St, Tech City, TC 12345",
    shippingMethod: "Express",
    paymentMethod: "Bank Transfer",
  };

  // Call backend to send order email:
  // await fetch('/api/email/send', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     to: order.clientEmail,
  //     type: 'order',
  //     data: order
  //   })
  // });
};

// ============================================================================
// 3. ORDER APPROVAL - Send Approval Email to Client
// ============================================================================

/**
 * Backend (orders.js):
 * When order is approved by admin, send approval email
 */
export const orderApprovalExample = async () => {
  // Called in PATCH /api/orders/:id/approve
  const order = {
    orderNumber: "ORD-2024-001234",
    orderDate: new Date().toISOString(),
    approvedBy: "John Admin",
    items: [
      { name: "Laptop", quantity: 2 },
      { name: "Mouse", quantity: 5 },
    ],
    totalAmount: 118375,
  };

  // sendEmail({
  //   to: order.requesterEmail,
  //   type: 'approval',
  //   data: order,
  //   async: true
  // });
};

// ============================================================================
// 4. INVOICE EMAIL - Send Invoice After Order Completion
// ============================================================================

/**
 * Backend (invoices.js or orders.js):
 * Send invoice email after invoice generation
 */
export const invoiceEmailExample = async () => {
  const invoice = {
    invoiceNumber: "INV-2024-00567",
    invoiceDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        description: "Laptop (2x @ 50000)",
        quantity: 1,
        amount: 100000,
      },
      {
        description: "Mouse (5x @ 500)",
        quantity: 1,
        amount: 2500,
      },
    ],
    subtotal: 102500,
    tax: 15375,
    totalAmount: 118375,
    clientName: "Acme Corp",
    clientEmail: "billing@acme.com",
    organization: "Acme Corporation",
    invoiceUrl: "https://nidotech.com/invoices/INV-2024-00567",
  };

  // sendEmail({
  //   to: invoice.clientEmail,
  //   type: 'invoice',
  //   data: invoice,
  //   async: true
  // });
};

// ============================================================================
// 5. CUSTOM/LEGACY EMAIL - Send Raw HTML
// ============================================================================

/**
 * For custom emails that don't fit templates
 */
export const customEmailExample = async () => {
  // await fetch('/api/email/send', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     to: 'user@example.com',
  //     subject: 'Custom Email',
  //     html: '<h1>Hello</h1><p>This is a custom email</p>',
  //     text: 'Hello\nThis is a custom email'
  //   })
  // });
};

// ============================================================================
// USAGE GUIDE
// ============================================================================

/**
 * STEP 1: Generate Email Template
 * ================================
 * const template = generateEmailTemplate(type, data);
 * Supported types: "credentials" | "order" | "approval" | "invoice"
 *
 * STEP 2: Send Email via Backend
 * ================================
 * POST /api/email/send
 * {
 *   "to": "recipient@example.com",
 *   "type": "credentials",
 *   "data": { ... email specific data ... }
 * }
 *
 * STEP 3: Email is Queued & Sent Asynchronously
 * ==============================================
 * - Email is added to queue
 * - Background worker processes it
 * - Automatic retry (up to 3 times) on failure
 * - Comprehensive logging for debugging
 *
 * FEATURES
 * ========
 * ✅ Beautiful HTML templates (SaaS-grade)
 * ✅ Mobile-responsive design
 * ✅ Retry logic (3 attempts, 2-second backoff)
 * ✅ Async queue (non-blocking)
 * ✅ Comprehensive logging
 * ✅ Error tracking
 * ✅ Email fallbacks (Ethereal for dev)
 * ✅ Inline CSS (email-safe)
 * ✅ Multiple template types
 */

// ============================================================================
// ENVIRONMENT SETUP
// ============================================================================

/**
 * Add to .env:
 *
 * SMTP_HOST=smtp.gmail.com
 * SMTP_PORT=587
 * SMTP_USER=your-email@gmail.com
 * SMTP_PASS=your-app-password
 * EMAIL_FROM=your-email@gmail.com
 * ETHEREAL_USER=fallback@ethereal.email
 * ETHEREAL_PASS=fallback-password
 * FRONTEND_URL=https://nidotech.com
 *
 * For Gmail:
 * 1. Enable 2FA
 * 2. Generate App Password
 * 3. Use app password in SMTP_PASS
 */

// ============================================================================
// ERROR HANDLING & LOGGING
// ============================================================================

/**
 * Logs format:
 *
 * 📋 [EMAIL QUEUED] 2024-04-30T10:15:30.123Z | To: user@example.com | Subject: Order Confirmed
 * 📤 [EMAIL SENDING] ... | Attempt 1/4
 * ✅ [EMAIL SUCCESS] ... | Message ID: <id@example.com>
 * 🔄 [EMAIL RETRY] ... | (Attempt 2/4)
 * ❌ [EMAIL FAILED] ... | Error: Connection timeout
 */

export default {
  createUserExample,
  orderConfirmationExample,
  orderApprovalExample,
  invoiceEmailExample,
  customEmailExample,
};
