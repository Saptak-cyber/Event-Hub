# Razorpay Payment Integration Setup Guide

This guide will help you set up Razorpay payment integration for the Event Management System.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Testing Locally](#testing-locally)
- [Webhook Configuration](#webhook-configuration)
- [Production Deployment](#production-deployment)
- [Testing Payment Flow](#testing-payment-flow)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The payment system uses Razorpay to handle:
- Event registration payments
- Payment verification
- Refund processing
- Webhook notifications for payment status updates

## Prerequisites

1. **Razorpay Account**: Sign up at [https://razorpay.com](https://razorpay.com)
2. **Node.js**: Version 14 or higher
3. **MongoDB**: Running instance
4. **ngrok** (for local webhook testing): Download from [https://ngrok.com](https://ngrok.com)

## Backend Setup

### 1. Get Razorpay API Credentials

1. Log in to your Razorpay Dashboard: [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **API Keys**
3. Click **Generate Test Key** (or use existing keys)
4. Copy both:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (keep this confidential!)

### 2. Configure Environment Variables

Edit `backend/.env`:

```env
# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE  # Optional for local testing
```

**Important:**
- Never commit these credentials to version control
- Use test credentials for development
- Use live credentials only in production

### 3. Install Dependencies

```bash
cd backend
npm install
```

The `razorpay` package (v2.9.2) is already included in `package.json`.

## Frontend Setup

### 1. Configure Environment Variables

Edit `frontend/.env`:

```env
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
```

**Note:** Use the same Key ID from your Razorpay dashboard (test mode).

### 2. Install Dependencies

```bash
cd frontend
npm install
```

The Razorpay checkout script is loaded dynamically via CDN - no package installation needed.

## Testing Locally

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
✅ Razorpay initialized
🚀 Server running on port 5000
```

### 2. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

### 3. Test Card Details

Use these test cards in Razorpay Test Mode:

| Card Number         | Scenario                  |
|---------------------|---------------------------|
| 4111 1111 1111 1111 | Successful payment        |
| 5555 5555 5555 4444 | Successful payment        |
| 4000 0000 0000 0002 | Payment declined          |
| 4000 0000 0000 9995 | Insufficient funds        |

**Additional Test Details:**
- **CVV**: Any 3 digits (e.g., 123)
- **Expiry Date**: Any future date (e.g., 12/25)
- **Cardholder Name**: Any name

### 4. UPI Testing (Test Mode)

- **Test UPI ID**: success@razorpay
- Use this in the Razorpay popup for successful UPI payment simulation

## Webhook Configuration

Webhooks allow Razorpay to notify your server about payment events (even if users close the browser).

### Local Development with ngrok

1. **Start ngrok tunnel**:
   ```bash
   ngrok http 5000
   ```

2. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

3. **Configure webhook in Razorpay Dashboard**:
   - Go to **Settings** → **Webhooks**
   - Click **Create New Webhook**
   - **Webhook URL**: `https://abc123.ngrok.io/api/payments/webhook`
   - **Alert Email**: Your email
   - **Active Events**: Select:
     - `payment.captured`
     - `payment.failed`
     - `refund.created`
   - **Secret**: Generate a secret (copy this!)
   - Click **Create Webhook**

4. **Update backend `.env`**:
   ```env
   RAZORPAY_WEBHOOK_SECRET=YOUR_GENERATED_SECRET
   ```

5. **Restart backend server** to apply changes

### Production Webhook Setup

For production deployment:

1. **Configure webhook URL**:
   ```
   https://your-domain.com/api/payments/webhook
   ```

2. **Use production webhook secret**

3. **Enable only necessary events**:
   - `payment.captured`
   - `payment.failed`
   - `refund.created`

## Production Deployment

### 1. Switch to Live Mode

1. In Razorpay Dashboard, toggle to **Live Mode**
2. Generate **Live API Keys**:
   - Navigate to **Settings** → **API Keys**
   - Click **Generate Live Key**
   - Copy **Key ID** and **Key Secret**

### 2. Update Environment Variables

Update production `.env` files:

**Backend:**
```env
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_PRODUCTION_WEBHOOK_SECRET
NODE_ENV=production
```

**Frontend:**
```env
VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
```

### 3. Activate Your Account

Before going live:
1. Complete KYC verification in Razorpay Dashboard
2. Submit required business documents
3. Wait for account activation (usually 24-48 hours)
4. Test with small real transactions before full launch

### 4. Security Checklist

- [ ] Live API keys secured in environment variables
- [ ] Webhook signature verification enabled
- [ ] HTTPS enabled on your domain
- [ ] CORS configured for your domain only
- [ ] Rate limiting enabled (already configured)
- [ ] Content Security Policy includes Razorpay domains

## Testing Payment Flow

### End-to-End Test

1. **Register a user account** (if not already done)
2. **Create a paid event** (as organizer)
   - Set a price (e.g., ₹500)
   - Mark as paid event
3. **Register for the event** (as different user)
   - Click "Register" button
   - Payment modal should appear
4. **Complete payment**:
   - Razorpay popup will open
   - Enter test card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: Any future date
   - Click "Pay"
5. **Verify success**:
   - Registration status should be "Confirmed"
   - Payment status should be "Completed"
   - QR code ticket should be generated

### Testing Refunds

1. **As admin/organizer**, go to event registrations
2. Click **Refund** on a completed payment
3. Confirm refund
4. Verify:
   - Refund processed in Razorpay
   - Registration status changed to "Cancelled"
   - Payment status changed to "Refunded"
   - Event capacity updated (seat freed)

### Testing Webhooks

1. Make a test payment
2. Check backend console logs:
   ```
   ✅ Payment captured: pay_ABC123XYZ
   ```
3. Verify webhook in Razorpay Dashboard:
   - Go to **Settings** → **Webhooks**
   - Click on your webhook
   - View **Last 10 Events** to see delivery status

## Security Best Practices

### 1. API Key Management

- **Never expose Key Secret** in frontend code
- Store keys in environment variables only
- Use different keys for test/production
- Rotate keys periodically
- Revoke compromised keys immediately

### 2. Payment Verification

The system implements secure payment verification:

```javascript
// Backend verifies payment signature
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(razorpay_order_id + '|' + razorpay_payment_id)
  .digest('hex');

if (expectedSignature !== razorpay_signature) {
  // Reject payment - signature mismatch
}
```

**Never trust frontend payment status without backend verification!**

### 3. Webhook Security

- Webhook signature is verified on every request
- Uses `RAZORPAY_WEBHOOK_SECRET` for verification
- Rejects requests with invalid signatures

### 4. Amount Validation

- Payment amount is calculated server-side only
- Frontend cannot manipulate payment amount
- Order metadata includes event/user IDs for verification

### 5. Environment-Specific Keys

| Environment | Key Type | Prefix      |
|-------------|----------|-------------|
| Development | Test     | `rzp_test_` |
| Production  | Live     | `rzp_live_` |

## Troubleshooting

### "Payment service not configured"

**Symptoms:** Error when trying to make payment

**Fix:**
- Check that `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in backend `.env`
- Verify keys start with `rzp_test_` (for test mode) or `rzp_live_` (for production)
- Restart backend server after changing `.env`

### "Failed to load payment gateway"

**Symptoms:** Payment modal shows error about loading gateway

**Fix:**
- Check internet connection
- Verify Razorpay script is not blocked by ad blockers
- Check browser console for CSP errors
- Ensure frontend `.env` has `VITE_RAZORPAY_KEY_ID`

### "Payment verification failed"

**Symptoms:** Payment completes but registration fails

**Fix:**
- Check backend logs for detailed error
- Verify order metadata matches user/event IDs
- Ensure webhook signature verification is working
- Check that `RAZORPAY_WEBHOOK_SECRET` is set correctly

### Webhook not receiving events

**Symptoms:** Payment succeeds but webhook handler not called

**Fix:**
- For local development: Ensure ngrok is running
- Check webhook URL is accessible publicly
- Verify webhook secret matches in Razorpay Dashboard and `.env`
- Check Razorpay Dashboard → Webhooks → Event Logs for delivery errors
- Ensure backend server is running

### "CORS Error" when opening Razorpay popup

**Fix:**
- Verify CSP configuration in `backend/server.js` includes Razorpay domains
- Check that frontend URL is in CORS whitelist
- Ensure HTTPS is used in production

## Additional Resources

- **Razorpay Documentation**: [https://razorpay.com/docs](https://razorpay.com/docs)
- **API Reference**: [https://razorpay.com/docs/api](https://razorpay.com/docs/api)
- **Payment Gateway Integration**: [https://razorpay.com/docs/payments/payment-gateway](https://razorpay.com/docs/payments/payment-gateway)
- **Webhooks Guide**: [https://razorpay.com/docs/webhooks](https://razorpay.com/docs/webhooks)
- **Test Cards**: [https://razorpay.com/docs/payments/payments/test-card-details](https://razorpay.com/docs/payments/payments/test-card-details)

## Support

If you encounter issues:

1. Check Razorpay Dashboard → **Event Logs** for payment details
2. Review backend server logs for errors
3. Verify all environment variables are set correctly
4. Test with Razorpay test cards first
5. Contact Razorpay support: [https://razorpay.com/support](https://razorpay.com/support)

---

**Note:** Always test thoroughly in test mode before going live with real payments!
