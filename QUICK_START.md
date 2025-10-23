# Quick Start Guide

Get your Event Management System up and running in minutes!

## Prerequisites Check

```bash
node --version  # Should be v16 or higher
npm --version
mongod --version
```

## 🚀 Fast Setup (5 Minutes)

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Backend

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event-management
JWT_SECRET=your_secret_key_change_this
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
```

### Step 3: Start MongoDB

```bash
# Mac/Linux
mongod

# Or with Homebrew
brew services start mongodb-community

# Windows
net start MongoDB
```

### Step 4: Run the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 👤 Create Your First Admin Account

1. Go to http://localhost:5173/register
2. Fill in the form
3. **Important:** Select "Event Organizer" as the role
4. Click "Create Account"

## 🎉 Create Your First Event

1. Login with your admin account
2. You'll be redirected to Admin Dashboard
3. Click "Create Event"
4. Fill in event details
5. Click "Create Event"

## 📧 Email Setup (Optional but Recommended)

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Generate App Password:
   - Security → App passwords
   - Select "Mail" and "Other"
   - Copy the 16-character password
4. Add to `backend/.env`:
   ```
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=abc123defg456hij  # Your app password
   ```

## ☁️ Cloudinary Setup (For Image Uploads)

1. Sign up at https://cloudinary.com
2. Go to Dashboard
3. Copy credentials:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefghijklmnop
   ```

## 🧪 Test the System

### As Admin:
1. Create an event
2. Upload a banner image
3. View event statistics

### As User:
1. Register a new account (choose "User" role)
2. Browse events
3. Register for an event
4. Check your dashboard

## 🐛 Common Issues

### Port 5000 Already in Use
```bash
lsof -ti:5000 | xargs kill
```

### MongoDB Not Running
```bash
# Check status
brew services list  # Mac

# Start MongoDB
brew services start mongodb-community
```

### CORS Error
Make sure `FRONTEND_URL` in backend/.env matches your frontend URL

### Email Not Sending
- Verify Gmail App Password
- Check if 2-Step Verification is enabled

## 📚 Next Steps

- Read the main [README.md](README.md) for complete documentation
- Check API endpoints in README
- Explore the code structure
- Customize the styling
- Add more features!

## 🎓 For Your Exam Project

**Key Points to Highlight:**

1. **Full MERN Stack**: MongoDB, Express, React, Node.js
2. **Authentication**: JWT with role-based access
3. **Real-time Features**: Cron jobs for automated reminders
4. **Third-party Integrations**: 
   - Google Calendar API
   - Cloudinary for images
   - Nodemailer for emails
5. **Modern UI**: Tailwind CSS, responsive design
6. **Best Practices**:
   - MVC architecture
   - Error handling
   - Input validation
   - Secure password hashing
   - Protected routes

## 📊 Demo Data

Create test accounts:

**Admin:**
- Email: admin@test.com
- Password: admin123
- Role: Event Organizer

**User:**
- Email: user@test.com
- Password: user123
- Role: User

Create sample events in different categories to showcase the system!

---

**Need Help?** Check the main README.md or the troubleshooting section.

**Good luck with your exam! 🎓**

