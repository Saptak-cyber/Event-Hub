import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

export const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `Event Management System <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

export const sendRegistrationConfirmation = async (userEmail, userName, eventDetails) => {
  const subject = `Registration Confirmed: ${eventDetails.title}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #667eea; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Registration Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Great news! You've successfully registered for the event:</p>
          
          <div class="event-details">
            <div class="detail-row">
              <span class="label">Event:</span> ${eventDetails.title}
            </div>
            <div class="detail-row">
              <span class="label">Date & Time:</span> ${new Date(eventDetails.dateTime).toLocaleString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div class="detail-row">
              <span class="label">Location:</span> ${eventDetails.location}
            </div>
            ${eventDetails.description ? `
            <div class="detail-row">
              <span class="label">Description:</span> ${eventDetails.description}
            </div>
            ` : ''}
          </div>
          
          <p>We'll send you a reminder before the event. See you there!</p>
          
          <div class="footer">
            <p>Event Management System | Do not reply to this email</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(userEmail, subject, html);
};

export const sendEventReminder = async (userEmail, userName, eventDetails, timeUntilEvent) => {
  const subject = `Reminder: ${eventDetails.title} - ${timeUntilEvent}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #f5576c; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .reminder-badge { background: #f5576c; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Event Reminder</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <div class="reminder-badge">Starting ${timeUntilEvent}</div>
          <p>Don't forget about your upcoming event:</p>
          
          <div class="event-details">
            <div class="detail-row">
              <span class="label">Event:</span> ${eventDetails.title}
            </div>
            <div class="detail-row">
              <span class="label">Date & Time:</span> ${new Date(eventDetails.dateTime).toLocaleString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div class="detail-row">
              <span class="label">Location:</span> ${eventDetails.location}
            </div>
          </div>
          
          <p>We look forward to seeing you there!</p>
          
          <div class="footer">
            <p>Event Management System | Do not reply to this email</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(userEmail, subject, html);
};

export const sendEventUpdate = async (userEmail, userName, eventDetails, updateMessage) => {
  const subject = `Event Update: ${eventDetails.title}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .update-message { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #00f2fe; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📢 Event Update</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>There's an important update for your event:</p>
          
          <div class="update-message">
            <strong>Update:</strong> ${updateMessage}
          </div>
          
          <div class="event-details">
            <div class="detail-row">
              <span class="label">Event:</span> ${eventDetails.title}
            </div>
            <div class="detail-row">
              <span class="label">Date & Time:</span> ${new Date(eventDetails.dateTime).toLocaleString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div class="detail-row">
              <span class="label">Location:</span> ${eventDetails.location}
            </div>
          </div>
          
          <div class="footer">
            <p>Event Management System | Do not reply to this email</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(userEmail, subject, html);
};

