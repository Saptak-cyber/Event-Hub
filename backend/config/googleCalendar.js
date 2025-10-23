import { google } from 'googleapis';

export const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

export const getAuthUrl = (userId) => {
  const oauth2Client = getOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: userId
  });
};

export const getTokensFromCode = async (code) => {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// export const addEventToCalendar = async (accessToken, eventDetails) => {
//   try {
//     const oauth2Client = getOAuth2Client();
//     oauth2Client.setCredentials({ access_token: accessToken });

//     const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

//     const eventEndTime = new Date(eventDetails.dateTime);
//     eventEndTime.setHours(eventEndTime.getHours() + 2); // Default 2 hour event

//     const event = {
//       summary: eventDetails.title,
//       location: eventDetails.location,
//       description: eventDetails.description || '',
//       start: {
//         dateTime: new Date(eventDetails.dateTime).toISOString(),
//         timeZone: 'UTC',
//       },
//       end: {
//         dateTime: eventEndTime.toISOString(),
//         timeZone: 'UTC',
//       },
//       reminders: {
//         useDefault: false,
//         overrides: [
//           { method: 'email', minutes: 24 * 60 },
//           { method: 'popup', minutes: 60 },
//         ],
//       },
//     };

//     const response = await calendar.events.insert({
//       calendarId: 'primary',
//       resource: event,
//     });

//     return response.data;
//   } catch (error) {
//     console.error('Error adding event to Google Calendar:', error);
//     throw error;
//   }
// };
export const addEventToCalendar = async (accessToken, refreshToken, eventDetails) => {
  try {
    const oauth2Client = getOAuth2Client();
    
    // Set credentials with both access and refresh tokens
    oauth2Client.setCredentials({ 
      access_token: accessToken,
      refresh_token: refreshToken
    });

    // This will automatically refresh the token if needed
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const eventEndTime = new Date(eventDetails.dateTime);
    eventEndTime.setHours(eventEndTime.getHours() + 2); // Default 2 hour event

    const event = {
      summary: eventDetails.title,
      location: eventDetails.location,
      description: eventDetails.description || '',
      start: {
        dateTime: new Date(eventDetails.dateTime).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventEndTime.toISOString(),
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.data;
  } catch (error) {
    console.error('Error adding event to calendar:', error);
    throw new Error(`Google Calendar API error: ${error.message}`);
  }
};

