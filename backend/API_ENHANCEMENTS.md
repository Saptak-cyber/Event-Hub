# Event Management System - API Enhancements Documentation

## 🎉 New Features Implemented

### 1. Security Enhancements ✅

#### Middleware Added
- **Helmet**: Security headers protection
- **Rate Limiting**: 
  - General API: 100 requests per 10 minutes
  - Auth endpoints: 5 requests per 15 minutes
- **MongoDB Sanitization**: NoSQL injection protection
- **Compression**: Response compression for better performance
- **Morgan Logging**: Request logging (dev/production modes)

#### Bug Fixes
- **Fixed duplicate registration vulnerability**: Enabled unique compound index on `event + user`

---

### 2. Stripe Payment Integration ✅

#### New Endpoints

**POST /api/payments/create-intent/:eventId**
- Creates Stripe payment intent for event registration
- Returns client secret for frontend payment processing
```bash
curl -X POST http://localhost:5002/api/payments/create-intent/<eventId> \
  -H "Authorization: Bearer <token>"
```

**POST /api/payments/confirm**
- Confirms payment and completes registration
- Body: `{ "paymentIntentId": "pi_xxx", "eventId": "xxx" }`
```bash
curl -X POST http://localhost:5002/api/payments/confirm \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId":"pi_xxx","eventId":"xxx"}'
```

**POST /api/payments/webhook**
- Stripe webhook handler for payment events
- Handles: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
```bash
# Configured in Stripe Dashboard
```

**POST /api/payments/refund/:registrationId**
- Refund a completed payment (Admin only)
```bash
curl -X POST http://localhost:5002/api/payments/refund/<registrationId> \
  -H "Authorization: Bearer <token>" \
  -d '{"reason":"requested_by_customer"}'
```

#### Environment Variables Required
```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

### 3. Email Verification Flow ✅

**POST /api/auth/register**
- Now sends verification email automatically
- User receives email with verification link

**GET /api/auth/verify-email/:token**
- Verifies user email address
- Token expires in 24 hours
```bash
curl http://localhost:5002/api/auth/verify-email/<token>
```

**POST /api/auth/resend-verification**
- Resends verification email (requires login)
```bash
curl -X POST http://localhost:5002/api/auth/resend-verification \
  -H "Authorization: Bearer <token>"
```

---

### 4. Password Reset Flow ✅

**POST /api/auth/forgot-password**
- Sends password reset email
- Body: `{ "email": "user@example.com" }`
```bash
curl -X POST http://localhost:5002/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**PUT /api/auth/reset-password/:token**
- Resets password using token
- Token expires in 1 hour
- Body: `{ "password": "newPassword123" }`
```bash
curl -X PUT http://localhost:5002/api/auth/reset-password/<token> \
  -H "Content-Type: application/json" \
  -d '{"password":"newPassword123"}'
```

---

### 5. Pagination ✅

All list endpoints now support pagination with query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10 for events, 20 for registrations)

**Examples:**

```bash
# Get events (page 2, 20 items per page)
curl "http://localhost:5002/api/events?page=2&limit=20"

# Get my registrations (page 1, 10 items)
curl "http://localhost:5002/api/registrations/my?page=1&limit=10" \
  -H "Authorization: Bearer <token>"

# Get event registrations (Admin)
curl "http://localhost:5002/api/registrations/event/<eventId>?page=1&limit=50" \
  -H "Authorization: Bearer <token>"
```

**Response Format:**
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "pages": 5,
  "data": [...]
}
```

---

### 6. Event Update Notifications ✅

**PUT /api/events/:id**
- Now automatically notifies all attendees when important event details change
- Tracks changes to: Title, Date/Time, Location, Status
- Sends beautiful HTML emails to all registered attendees

**No code changes needed** - Works automatically when updating events!

---

### 7. QR Code Ticket Generation ✅

#### New Fields in Registration Model
- `qrCode`: Data URL of generated QR code
- `ticketNumber`: Unique ticket identifier (auto-generated)

**GET /api/registrations/:registrationId/qrcode**
- Generates QR code for confirmed registration
- Returns QR code image as data URL
```bash
curl http://localhost:5002/api/registrations/<registrationId>/qrcode \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "ticketNumber": "TKT-LX9K2M1-A3F4B7C8",
    "event": { ... },
    "user": { ... }
  }
}
```

**POST /api/registrations/verify-qr** (Admin only)
- Verifies QR code at event check-in
- Body: `{ "qrData": "{...}" }`
```bash
curl -X POST http://localhost:5002/api/registrations/verify-qr \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"qrData":"{\"ticketNumber\":\"TKT-xxx\",\"registrationId\":\"xxx\"}"}'
```

---

### 8. Admin Analytics Dashboard ✅

**GET /api/admin/analytics**
- Platform-wide analytics with time range filter
- Query params: `timeRange` (7d, 30d, 90d, 1y)
```bash
curl "http://localhost:5002/api/admin/analytics?timeRange=30d" \
  -H "Authorization: Bearer <admin_token>"
```

**Response includes:**
- Overview: Total users, events, registrations, revenue
- Growth: New users, events, registrations in time range
- Category distribution
- Top 10 events by registrations
- Daily registration trends
- Event status breakdown
- Check-in rate

**GET /api/admin/users**
- User management with search and filters
- Query params: `page`, `limit`, `search`, `role`, `verified`
```bash
curl "http://localhost:5002/api/admin/users?page=1&limit=20&role=user" \
  -H "Authorization: Bearer <admin_token>"
```

**PUT /api/admin/users/:id/role**
- Update user role (user/admin)
```bash
curl -X PUT http://localhost:5002/api/admin/users/<userId>/role \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

**DELETE /api/admin/users/:id**
- Delete user and all associated data
```bash
curl -X DELETE http://localhost:5002/api/admin/users/<userId> \
  -H "Authorization: Bearer <admin_token>"
```

**GET /api/admin/revenue**
- Revenue analytics with date range filter
- Query params: `startDate`, `endDate`
```bash
curl "http://localhost:5002/api/admin/revenue?startDate=2026-01-01&endDate=2026-02-01" \
  -H "Authorization: Bearer <admin_token>"
```

**Includes:**
- Revenue by event (top 20)
- Revenue by category
- Monthly revenue trends
- Payment status breakdown

**GET /api/admin/export/:type**
- Export data as JSON
- Types: `users`, `events`, `registrations`
- Query params for registrations: `eventId` (optional)
```bash
# Export all users
curl http://localhost:5002/api/admin/export/users \
  -H "Authorization: Bearer <admin_token>" > users.json

# Export specific event registrations
curl "http://localhost:5002/api/admin/export/registrations?eventId=xxx" \
  -H "Authorization: Bearer <admin_token>" > registrations.json
```

---

## 📊 Updated API Routes Summary

### Auth Routes
- POST `/api/auth/register` - Register (+ email verification)
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user
- GET `/api/auth/logout` - Logout
- PUT `/api/auth/updatedetails` - Update profile
- PUT `/api/auth/updatepassword` - Change password
- **NEW** GET `/api/auth/verify-email/:token` - Verify email
- **NEW** POST `/api/auth/resend-verification` - Resend verification
- **NEW** POST `/api/auth/forgot-password` - Request password reset
- **NEW** PUT `/api/auth/reset-password/:token` - Reset password

### Event Routes (with pagination)
- GET `/api/events?page=1&limit=10` - List events
- GET `/api/events/:id` - Get event
- POST `/api/events` - Create event (Admin)
- PUT `/api/events/:id` - Update event (Admin) + **Auto-notify attendees**
- DELETE `/api/events/:id` - Delete event (Admin)
- GET `/api/events/my/organized?page=1&limit=10` - My organized events (Admin)
- GET `/api/events/:id/stats` - Event statistics (Admin)

### Registration Routes (with pagination + QR codes)
- POST `/api/registrations/:eventId` - Register for event
- DELETE `/api/registrations/:registrationId` - Cancel registration
- GET `/api/registrations/my?page=1&limit=10` - My registrations
- GET `/api/registrations/event/:eventId?page=1&limit=20` - Event registrations (Admin)
- PUT `/api/registrations/:registrationId/checkin` - Check-in (Admin)
- **NEW** GET `/api/registrations/:registrationId/qrcode` - Generate QR code
- **NEW** POST `/api/registrations/verify-qr` - Verify QR code (Admin)

### Payment Routes (NEW)
- POST `/api/payments/create-intent/:eventId` - Create payment intent
- POST `/api/payments/confirm` - Confirm payment
- POST `/api/payments/webhook` - Stripe webhook
- POST `/api/payments/refund/:registrationId` - Refund payment (Admin)

### Admin Routes (NEW)
- GET `/api/admin/analytics?timeRange=30d` - Platform analytics
- GET `/api/admin/users?page=1&limit=20` - User management
- PUT `/api/admin/users/:id/role` - Update user role
- DELETE `/api/admin/users/:id` - Delete user
- GET `/api/admin/revenue?startDate=xxx&endDate=xxx` - Revenue analytics
- GET `/api/admin/export/:type` - Export data

---

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Update `.env` with Stripe credentials:
```env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Get Stripe Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your "Secret key" → `STRIPE_SECRET_KEY`
3. Set up webhook:
   - Go to https://dashboard.stripe.com/test/webhooks
   - Add endpoint: `http://your-domain.com/api/payments/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
   - Copy "Signing secret" → `STRIPE_WEBHOOK_SECRET`

### 4. Run Server
```bash
npm start
```

---

## 📈 Performance Improvements

1. **Pagination**: All list endpoints now paginated - prevents memory overflow
2. **Compression**: Responses compressed automatically
3. **Rate Limiting**: Prevents API abuse and DDoS
4. **MongoDB Sanitization**: Faster queries, prevents injection
5. **Indexes**: Added index on `ticketNumber` for fast QR lookups

---

## 🔐 Security Improvements

1. **Helmet**: Sets 11+ security headers
2. **Rate Limiting**: Prevents brute force attacks
3. **NoSQL Injection Prevention**: Sanitizes all inputs
4. **Unique Registration Index**: Prevents duplicate registrations
5. **Email Verification**: Ensures valid email addresses
6. **Password Reset**: Secure token-based flow (1-hour expiry)
7. **QR Code Verification**: Prevents ticket fraud

---

## 📧 Email Templates

All emails now use beautiful HTML templates with:
- Modern gradient designs
- Responsive layouts
- Clear call-to-action buttons
- Event details in styled cards
- Professional branding

Email types:
1. Registration confirmation
2. Event reminders (24h & 1h before)
3. Event updates
4. Email verification
5. Password reset

---

## 🎯 Next Steps for Production

1. **Email Service**: Switch from Gmail to SendGrid/AWS SES for scalability
2. **Caching**: Add Redis for session and query caching
3. **Queue System**: Use Bull/BeeQueue for background jobs
4. **Monitoring**: Add Sentry for error tracking
5. **API Documentation**: Generate Swagger/OpenAPI docs
6. **Testing**: Add unit and integration tests
7. **CDN**: Configure Cloudinary CDN settings
8. **Database**: Add more indexes based on query patterns
9. **Backups**: Set up automated MongoDB backups
10. **SSL**: Enable HTTPS in production

---

## 🐛 Testing Checklist

- [x] Registration prevents duplicates
- [x] Rate limiting blocks excessive requests
- [x] Pagination works on all endpoints
- [x] Email verification sends and validates
- [x] Password reset flow completes
- [x] Payment intent creation works
- [x] QR code generation and verification
- [x] Event updates notify attendees
- [x] Admin analytics returns correct data
- [x] User role updates work
- [x] Export functions return data

---

## 💡 Tips

1. **Testing Stripe**: Use test card `4242 4242 4242 4242` with any future date and CVC
2. **Email Testing**: Check spam folder if emails don't arrive
3. **QR Codes**: Test with any QR code scanner app
4. **Admin Access**: Create admin user by updating role in database
5. **Rate Limit Testing**: Use Postman with delay to avoid limits

---

Built with ❤️ for superior event management experience!
