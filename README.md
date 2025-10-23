# Event Management System

A full-stack Event Management System built with the MERN stack (MongoDB, Express.js, React, Node.js) that allows admins to create and manage events while users can browse, register, and receive automated reminders.

## 🚀 Features

### For Users
- **Event Discovery**: Browse and search events by category, date, and status
- **Easy Registration**: Quick RSVP system with email confirmation
- **Google Calendar Integration**: Add registered events directly to Google Calendar
- **Smart Reminders**: Automated email reminders 24 hours and 1 hour before events
- **Personal Dashboard**: View and manage all registered events
- **Real-time Updates**: Get notified about event changes and updates

### For Admins/Organizers
- **Event Management**: Create, edit, and delete events with rich details
- **Image Upload**: Upload custom event banners via Cloudinary
- **Registration Tracking**: View all registrations and attendee lists
- **Analytics Dashboard**: Track event performance and registration statistics
- **Check-in System**: Mark attendees as checked in during events
- **Waitlist Management**: Automatically move users from waitlist when spots open

### Technical Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Separate permissions for users and admins
- **Automated Cron Jobs**: Scheduled email reminders and status updates
- **Email Notifications**: Beautiful HTML email templates
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Real-time Validation**: Form validation on both frontend and backend

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **Node-cron** - Scheduled tasks
- **Multer** - File upload handling
- **Cloudinary** - Cloud image storage
- **Google APIs** - Calendar integration

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Date-fns** - Date formatting

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or Atlas)
- **Git**

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Event Management"
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/event-management
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/event-management

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google Calendar API Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd ../frontend

# Install dependencies
npm install

# Create .env file (optional)
# echo "VITE_API_URL=http://localhost:5000/api" > .env
```

## 🚦 Running the Application

### Start Backend Server

```bash
# From backend directory
cd backend

# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

The backend server will start on `http://localhost:5000`

### Start Frontend Application

```bash
# From frontend directory (in a new terminal)
cd frontend

# Start development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## 📧 Email Setup (Gmail)

To enable email notifications:

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password:
   - Go to Security → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the generated password
4. Use this password in `EMAIL_PASSWORD` in your `.env` file

## ☁️ Cloudinary Setup

For image uploads:

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to Dashboard
3. Copy your:
   - Cloud Name
   - API Key
   - API Secret
4. Add them to your `.env` file

## 📅 Google Calendar API Setup (Optional)

For calendar integration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Google Calendar API"
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
5. Copy Client ID and Client Secret to `.env`

## 🗄️ Database Setup

### Local MongoDB

```bash
# Start MongoDB service
mongod

# Or with Homebrew (Mac)
brew services start mongodb-community
```

### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get connection string and add to `MONGODB_URI` in `.env`

## 👥 Default Users

For testing, you can create users with these roles:

### Admin Account
```javascript
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

### Regular User Account
```javascript
{
  "name": "Test User",
  "email": "user@example.com",
  "password": "user123",
  "role": "user"
}
```

Register these accounts through the `/register` page.

## 📁 Project Structure

```
Event Management/
├── backend/
│   ├── config/          # Configuration files
│   │   ├── database.js
│   │   ├── cloudinary.js
│   │   ├── email.js
│   │   └── googleCalendar.js
│   ├── controllers/     # Route controllers
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   └── registrationController.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── errorHandler.js
│   ├── models/          # Database models
│   │   ├── User.js
│   │   ├── Event.js
│   │   └── Registration.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   └── registrationRoutes.js
│   ├── utils/           # Utility functions
│   │   └── cronJobs.js
│   ├── .env             # Environment variables
│   ├── server.js        # Entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/  # Reusable components
    │   │   ├── Navbar.jsx
    │   │   ├── EventCard.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── context/     # React context
    │   │   └── AuthContext.jsx
    │   ├── pages/       # Page components
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Events.jsx
    │   │   ├── EventDetails.jsx
    │   │   ├── UserDashboard.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   └── CreateEvent.jsx
    │   ├── utils/       # Utility functions
    │   │   └── api.js
    │   ├── App.jsx      # Main app component
    │   ├── main.jsx     # Entry point
    │   └── index.css    # Global styles
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout user
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password

### Events
- `GET /api/events` - Get all events (with filters)
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (Admin)
- `PUT /api/events/:id` - Update event (Admin)
- `DELETE /api/events/:id` - Delete event (Admin)
- `POST /api/events/:id/banner` - Upload event banner (Admin)
- `GET /api/events/my/organized` - Get my organized events (Admin)

### Registrations
- `POST /api/registrations/:eventId` - Register for event
- `DELETE /api/registrations/:registrationId` - Cancel registration
- `GET /api/registrations/my` - Get my registrations
- `GET /api/registrations/event/:eventId` - Get event registrations (Admin)
- `PUT /api/registrations/:registrationId/checkin` - Check-in attendee (Admin)
- `POST /api/registrations/:registrationId/add-to-calendar` - Add to Google Calendar

## ⏰ Cron Jobs

The system runs automated tasks:

- **24-hour reminders**: Daily at 9 AM - sends reminder emails for events happening in 24 hours
- **1-hour reminders**: Every hour - sends reminder emails for events happening in 1 hour
- **Status updates**: Every 30 minutes - updates event statuses (upcoming → ongoing → completed)

## 🎨 Features in Detail

### Event Categories
- Conference
- Workshop
- Seminar
- Webinar
- Meetup
- Networking
- Social
- Sports
- Cultural
- Tech
- Other

### Event Statuses
- **Upcoming**: Event hasn't started yet
- **Ongoing**: Event is currently happening
- **Completed**: Event has ended
- **Cancelled**: Event was cancelled

### Registration Statuses
- **Confirmed**: Successfully registered
- **Waitlist**: Added to waitlist (when event is full)
- **Cancelled**: Registration cancelled

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
mongod

# Or check MongoDB Atlas connection string
```

### Email Not Sending
- Verify Gmail App Password is correct
- Check if 2-Step Verification is enabled
- Ensure EMAIL_USER and EMAIL_PASSWORD are set in .env

### Image Upload Fails
- Verify Cloudinary credentials
- Check file size (max 5MB)
- Ensure image format is supported (JPG, PNG, GIF)

### Port Already in Use
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill

# Or use a different port in .env
PORT=5001
```

## 🚀 Deployment

### Backend (Heroku/Render)
1. Set all environment variables
2. Set `NODE_ENV=production`
3. Update `FRONTEND_URL` to your deployed frontend URL

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Set `VITE_API_URL` to your backend URL
3. Deploy the `dist` folder

## 📝 License

This project is created for educational purposes.

## 👨‍💻 Author

Created as a college project demonstrating MERN stack capabilities.

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Cloudinary for image storage
- Google APIs for calendar integration
- All open-source libraries used in this project

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the API documentation
3. Check environment variables configuration

---

**Happy Event Managing! 🎉**

