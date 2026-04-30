# 🚀 Email System - Quick Reference Guide

## 📋 Quick Start (5 Minutes)

### Step 1: Configure SMTP

```env
# .env file
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=https://nidotech.com
```

### Step 2: Verify Service

```bash
curl http://localhost:5000/api/email/verify
# Response: { "success": true, "message": "Email service is operational" }
```

### Step 3: Send Email

```javascript
// Any route/handler
import { sendEmail } from "../utils/emailService.js";

await sendEmail({
  to: "user@example.com",
  type: "credentials", // or "order", "approval", "invoice"
  data: {
    /* template data */
  },
  async: true, // non-blocking
});
```

---

## 📧 Email Types & Data

### 1️⃣ Credentials Email

```javascript
{
  to: "newuser@company.com",
  type: "credentials",
  data: {
    username: "john_doe",
    email: "john@company.com",
    temporaryPassword: "TempPwd123!@#",
    createdBy: "System Owner",
    userType: "Client Admin",
    loginUrl: "https://nidotech.com/login"
  }
}
```

### 2️⃣ Order Email

```javascript
{
  to: "procurement@acme.com",
  type: "order",
  data: {
    orderNumber: "ORD-2024-001234",
    orderDate: "2024-04-30T10:00:00Z",
    items: [
      { name: "Laptop", quantity: 2, price: 50000, category: "Electronics" }
    ],
    subtotal: 100000,
    tax: 15000,
    shippingCharges: 500,
    totalAmount: 115500,
    clientName: "Acme Corp",
    clientEmail: "procurement@acme.com",
    organization: "Acme Corporation",
    deliveryAddress: "123 Business St, Tech City",
    shippingMethod: "Express",
    paymentMethod: "Bank Transfer"
  }
}
```

### 3️⃣ Approval Email

```javascript
{
  to: "procurement@acme.com",
  type: "approval",
  data: {
    orderNumber: "ORD-2024-001234",
    orderDate: "2024-04-30T10:00:00Z",
    approvedBy: "John Admin",
    items: [
      { name: "Laptop", quantity: 2 }
    ],
    totalAmount: 115500
  }
}
```

### 4️⃣ Invoice Email

```javascript
{
  to: "billing@acme.com",
  type: "invoice",
  data: {
    invoiceNumber: "INV-2024-00567",
    invoiceDate: "2024-04-30T10:00:00Z",
    dueDate: "2024-05-30T10:00:00Z",
    items: [
      { description: "Laptop (2x @ 50000)", quantity: 1, amount: 100000 }
    ],
    subtotal: 100000,
    tax: 15000,
    totalAmount: 115000,
    clientName: "Acme Corp",
    clientEmail: "billing@acme.com",
    organization: "Acme Corporation",
    invoiceUrl: "https://nidotech.com/invoices/INV-2024-00567"
  }
}
```

---

## 🔌 Integration Points

### Backend: User Creation

```javascript
// backend/routes/auth.js - Already done ✅
router.post(
  "/users",
  authMiddleware,
  roleMiddleware(["OWNER"]),
  async (req, res) => {
    // ... user creation logic ...

    // Credentials email sent automatically
    void sendEmail({
      to: generatedEmail,
      type: "credentials",
      data: {
        /* ... */
      },
      async: true,
    }).catch((err) => console.error("Email failed:", err));
  },
);
```

### Backend: Order Confirmation

```javascript
// backend/routes/orders.js - Already done ✅
router.post("/", authMiddleware, async (req, res) => {
  // ... order creation logic ...

  // Order email sent
  void sendEmail({
    to: order.requesterEmail,
    type: "order",
    data: {
      /* ... */
    },
    async: true,
  });
});
```

### Backend: Order Approval

```javascript
// backend/routes/orders.js - Already done ✅
router.patch("/:id/approve", authMiddleware, async (req, res) => {
  // ... order approval logic ...

  // Approval email sent
  void sendEmail({
    to: order.requesterEmail,
    type: "approval",
    data: {
      /* ... */
    },
    async: true,
  });
});
```

---

## 🧪 Testing Emails

### Test 1: Verify Service

```bash
curl http://localhost:5000/api/email/verify
```

### Test 2: Send Credentials Email

```bash
curl -X POST http://localhost:5000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "type": "credentials",
    "data": {
      "username": "test_user",
      "email": "test@example.com",
      "temporaryPassword": "TestPwd123!",
      "createdBy": "Test Admin",
      "userType": "Test User",
      "loginUrl": "http://localhost:8080/login"
    }
  }'
```

### Test 3: Create User (Auto-sends Credentials)

```bash
curl -X POST http://localhost:5000/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@company.com",
    "role": "CLIENT_ADMIN"
  }'
# Credentials email sent automatically
```

### Test 4: Check Console Logs

```
✅ [EMAIL SUCCESS] 2024-04-30T10:15:30Z | To: test@example.com | Message ID: <id>
```

---

## 📊 Console Log Guide

### Success

```
✅ [EMAIL SUCCESS] 2024-04-30T10:15:30.123Z | To: user@ex.com | Subject: Order Confirmed | Message ID: <id@example.com>
```

### Queued

```
📋 [EMAIL QUEUED] 2024-04-30T10:15:30.123Z | To: user@ex.com | Subject: Credentials
```

### Sending

```
📤 [EMAIL SENDING] 2024-04-30T10:15:30.123Z | To: user@ex.com | Subject: Order (Attempt 1/4)
```

### Retry

```
🔄 [EMAIL RETRY] 2024-04-30T10:15:32.123Z | To: user@ex.com | (Attempt 2/4)
```

### Failure

```
❌ [EMAIL FAILED] 2024-04-30T10:15:36.123Z | To: user@ex.com | Error: Connection timeout
```

---

## 🐛 Troubleshooting

### Email not sending?

1. ✅ Check `.env` SMTP settings
2. ✅ Run verification: `GET /api/email/verify`
3. ✅ Check console logs
4. ✅ Check spam folder

### SMTP Auth Failed?

```
Error: Invalid login: 535-5.7.8 Username and password not accepted
Solution: Use Gmail App Password (not regular password)
```

### Connection Timeout?

```
Error: connect ETIMEDOUT
Solution: Check SMTP_HOST and SMTP_PORT in .env
Try: smtp.gmail.com:587
```

### Certificate Error?

```
Error: self signed certificate in certificate chain
Solution: For dev, disable SSL verification or use correct certificates
```

---

## 🎯 Common Tasks

### Task 1: Send Email to Multiple Recipients

```javascript
await sendEmail({
  to: ["user1@ex.com", "user2@ex.com"],
  type: "order",
  data: {
    /* ... */
  },
});
```

### Task 2: Send Custom HTML Email

```javascript
await sendEmail({
  to: "user@ex.com",
  subject: "Custom Email",
  html: "<h1>Hello</h1>",
  text: "Hello",
});
```

### Task 3: Handle Email Errors

```javascript
try {
  await sendEmail({
    to: "user@ex.com",
    type: "credentials",
    data: {
      /* ... */
    },
  });
} catch (error) {
  console.error("Email failed:", error);
  // Handle gracefully
}
```

### Task 4: Queue Email (Non-blocking)

```javascript
// Default - uses queue (non-blocking)
void sendEmail({
  to: "user@ex.com",
  type: "order",
  data: {
    /* ... */
  },
  async: true, // Email processed in background
}).catch((err) => console.error(err));
```

---

## 📚 File Reference

| File                             | Purpose                   | Location          |
| -------------------------------- | ------------------------- | ----------------- |
| `emailTemplateGenerator.js`      | Template definitions      | `backend/utils/`  |
| `emailService.js`                | Email sending service     | `backend/utils/`  |
| `email.js`                       | API endpoints             | `backend/routes/` |
| `auth.js`                        | User creation integration | `backend/routes/` |
| `orders.js`                      | Order email integration   | `backend/routes/` |
| `emailIntegrationExamples.js`    | Usage examples            | `backend/utils/`  |
| `EMAIL_SYSTEM_README.md`         | Full documentation        | Root              |
| `EMAIL_SYSTEM_IMPLEMENTATION.md` | Implementation details    | Root              |
| `EMAIL_VISUAL_PREVIEWS.md`       | Visual templates          | Root              |

---

## ✅ Production Checklist

- [ ] SMTP credentials configured in `.env`
- [ ] Email service verified: `GET /api/email/verify`
- [ ] Test credentials email sent
- [ ] Test order email sent
- [ ] Test approval email sent
- [ ] Console logs reviewed
- [ ] Error handling in place
- [ ] Frontend displays errors gracefully
- [ ] Monitor email delivery
- [ ] Set up email templates in email client

---

## 🚀 You're Ready!

The email system is production-ready. Just:

1. ✅ Configure SMTP
2. ✅ Test one endpoint
3. ✅ Monitor logs
4. ✅ Deploy with confidence

**All emails automatically sent from:**

- ✅ User creation (credentials)
- ✅ Order placement (confirmation)
- ✅ Order approval (approval)
- ✅ Invoice generation (invoice)

---

**Last Updated:** April 30, 2024
**Status:** Production Ready ✅
