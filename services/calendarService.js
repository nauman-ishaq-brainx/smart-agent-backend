const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Set refresh token
oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

const addEvent = async ({ summary, description, startTime, endTime, attendees }) => {
    try {
        const event = {
      summary,
      description,
      start: {
        dateTime: startTime, // ISO string passed as param
        timeZone: "Asia/Karachi",
      },
      end: {
        dateTime: endTime,
        timeZone: "Asia/Karachi",
      },
      attendees, // passed array of { email, displayName? }
    };


        const response = await calendar.events.insert({
            calendarId: "primary",
            resource: event,
            sendUpdates: "all", // Sends invitation emails to attendees
        });



        return response.data;
    } catch (err) {

        throw err;
    }
};

const getEventsInRange = async (startTimeISO, endTimeISO) => {
    try {
        const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: startTimeISO,
            timeMax: endTimeISO,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = res.data.items;

        if (!events.length) {
            return [];
        }


        events.forEach((event, i) => {
            const start = event.start.dateTime || event.start.date;
        });

        return events;
    } catch (error) {
        throw error;
    }
};


module.exports = {
    addEvent, getEventsInRange
};
