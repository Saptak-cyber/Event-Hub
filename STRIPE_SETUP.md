# Stripe Setup Guide

## Quick Setup (5 minutes)

### 1. Get Stripe Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Create a free account (no credit card required for test mode)
3. After signup, go to **Developers** → **API Keys**
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 2. Configure Backend

Edit `backend/.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE  # Optional for local testing
```

### 3. Configure Frontend

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5002/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

### 4. Test the Integration

Use these **Stripe test cards**:

| Card Number         | Scenario           | Description                    |
|---------------------|--------------------|---------------------------------|
| 4242 4242 4242 4242 | ✅ Success          | Payment succeeds               |
| 4000 0000 0000 0002 | ❌ Decline          | Card declined                  |
| 4000 0000 0000 9995 | ❌ Insufficient     | Insufficient funds             |
| 4000 0025 0000 3155 | ⚠️ Auth Required   | Requires authentication (3D Secure) |

**For all cards:**
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

---

## Webhook Setup (Optional - for Production)

Webhooks ensure payment confirmations even if the user closes the browser.

### Local Testing with Stripe CLI

1. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**
   ```bash
   stripe login
   ```

3. **Forward Webhooks to Local Server**
   ```bash
   stripe listen --forward-to http://localhost:5002/api/payments/webhook
   ```

4. **Copy Webhook Secret**
   - CLI will output: `whsec_...`
   - Add to `backend/.env`:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
     ```

5. **Test Webhook**
   ```bash
   stripe trigger payment_intent.succeeded
   ```

### Production Webhook Setup

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your production URL: `https://yourdomain.com/api/payments/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to production `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
   ```

---

## Payment Flow Explanation

### 1. User Clicks "Register" on Paid Event

```javascript
// Frontend: EventDetails.jsx
const handleRegister = () => {
  if (event.isPaid) {
    setShowPayment(true); // Show Stripe modal
  } else {
    // Free event - direct registration
    registerDirectly();
  }
};
```

### 2. Create Payment Intent (Backend Calculates Amount)

```javascript
// Frontend: PaymentModal.jsx
const { data } = await api.post(`/payments/create-intent/${eventId}`);
// Returns: { clientSecret: 'pi_xxx_secret_xxx' }
```

```javascript
// Backend: paymentController.js
const event = await Event.findById(eventId);
const paymentIntent = await stripe.paymentIntents.create({
  amount: event.price * 100, // Convert to cents
  currency: 'usd',
  metadata: { eventId, userId }
});
```

### 3. User Enters Card Details (Stripe Handles)

Stripe Elements securely collects card info without your server touching it.

### 4. Confirm Payment (Stripe Processes)

```javascript
// Frontend: PaymentModal.jsx
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
});
```

### 5. Create Registration (Backend Verifies)

```javascript
// Frontend: PaymentModal.jsx
if (result.paymentIntent.status === 'succeeded') {
  await api.post('/payments/confirm', {
    paymentIntentId: result.paymentIntent.id
  });
}
```

```javascript
// Backend: paymentController.js
const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
// Verify payment actually succeeded before creating registration
if (paymentIntent.status === 'succeeded') {
  const registration = await Registration.create({
    event: paymentIntent.metadata.eventId,
    user: paymentIntent.metadata.userId,
    status: 'confirmed'
  });
}
```

### 6. Webhook Backup (Async Confirmation)

If user closes browser before step 5, webhook ensures registration is created:

```javascript
// Backend: paymentController.js - Webhook Handler
stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
// Verifies webhook came from Stripe

if (event.type === 'payment_intent.succeeded') {
  const paymentIntent = event.data.object;
  // Check if registration already exists
  const existing = await Registration.findOne({
    event: paymentIntent.metadata.eventId,
    user: paymentIntent.metadata.userId
  });
  if (!existing) {
    // Create registration from webhook
    await Registration.create({ ... });
  }
}
```

---

## Security Best Practices

### ✅ What the App Does Right

1. **Amount Calculated Server-Side**
   - Frontend never sends the price
   - Backend reads from Event model: `event.price`
   - User can't manipulate payment amount

2. **Payment Verification**
   - Backend retrieves PaymentIntent from Stripe before creating registration
   - Confirms `status === 'succeeded'`
   - Double-checks metadata matches (eventId, userId)

3. **Webhook Signature Verification**
   ```javascript
   const event = stripe.webhooks.constructEvent(
     rawBody,
     signature,
     webhookSecret
   );
   // Throws error if signature doesn't match
   ```

4. **Idempotency (No Duplicate Registrations)**
   - Unique index: `{event: 1, user: 1}`
   - Webhook checks for existing registration before creating

5. **Raw Body for Webhook**
   ```javascript
   // server.js
   app.post('/api/payments/webhook', 
     express.raw({ type: 'application/json' }), 
     handleWebhook
   );
   ```
   Stripe requires raw body to verify signature.

### ❌ Common Mistakes to Avoid

1. **DON'T trust frontend for amount**
   ```javascript
   // ❌ NEVER DO THIS
   const amount = req.body.amount; // User can change this!
   
   // ✅ DO THIS
   const event = await Event.findById(eventId);
   const amount = event.price * 100;
   ```

2. **DON'T skip payment verification**
   ```javascript
   // ❌ NEVER DO THIS
   await Registration.create({ ... }); // Without checking payment status!
   
   // ✅ DO THIS
   const paymentIntent = await stripe.paymentIntents.retrieve(id);
   if (paymentIntent.status === 'succeeded') {
     await Registration.create({ ... });
   }
   ```

3. **DON'T expose secret key**
   - Never commit `.env` to git
   - Use environment variables in production

---

## Testing Checklist

- [ ] Test successful payment (4242 card)
- [ ] Test declined payment (0002 card)
- [ ] Test insufficient funds (9995 card)
- [ ] Verify registration created in database
- [ ] Check QR code ticket generates
- [ ] Test webhook with Stripe CLI
- [ ] Verify no duplicate registrations possible
- [ ] Test refund flow (admin only)

---

## Troubleshooting

### Issue: "Invalid API Key"
- **Fix:** Check that `STRIPE_SECRET_KEY` in backend `.env` starts with `sk_test_`
- **Fix:** Restart backend server after changing `.env`

### Issue: Payment Modal Doesn't Open
- **Fix:** Check that `VITE_STRIPE_PUBLISHABLE_KEY` in frontend `.env` starts with `pk_test_`
- **Fix:** Restart frontend dev server with `npm run dev`

### Issue: "No such payment_intent"
- **Fix:** Ensure backend and frontend are using keys from same Stripe account
- **Fix:** Check that payment intent was created successfully before confirming

### Issue: Webhook Returns 401
- **Fix:** Webhook endpoint uses `express.raw()` not `express.json()`
- **Fix:** Check that `STRIPE_WEBHOOK_SECRET` is set correctly

### Issue: Double Registration Created
- **Fix:** Ensure unique index is active: `{event: 1, user: 1}`
- **Fix:** Check for existing registration before creating in webhook

---

## Production Deployment

1. **Switch to Live Mode**
   - Get live keys from Stripe Dashboard (starts with `pk_live_` and `sk_live_`)
   - Update `.env` files with live keys
   - Set `NODE_ENV=production`

2. **Configure Production Webhook**
   - Add webhook endpoint in Stripe Dashboard
   - Use production URL: `https://yourdomain.com/api/payments/webhook`
   - Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

3. **Enable Stripe Radar (Fraud Protection)**
   - Free with Stripe account
   - Automatically enabled for live mode
   - Blocks suspicious payments

4. **Set Up Monitoring**
   - Monitor failed payments in Stripe Dashboard
   - Set up email alerts for failed charges
   - Track refund requests

---

## Support

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Test Cards:** https://stripe.com/docs/testing
- **Webhook Testing:** https://stripe.com/docs/webhooks/test
- **Stripe CLI:** https://stripe.com/docs/stripe-cli

---

**Ready to accept payments!** 💳✨
