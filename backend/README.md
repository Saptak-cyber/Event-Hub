# Event Management System - Backend

This is the backend server for the Event Management System built with Node.js and Express.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Environment Variables

Required environment variables:

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_PASSWORD` - Gmail app password
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

Optional:
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `FRONTEND_URL` - Frontend URL for CORS

## API Documentation

See main README.md for complete API documentation.

## Tech Stack

- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Nodemailer for emails
- Cloudinary for images
- Node-cron for scheduled tasks

