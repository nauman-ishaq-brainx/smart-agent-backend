const { addEvent, getEventsInRange } = require('../services/calendarService');

addEvent({
  summary: 'Meeting with Ali Bhai',
  description: 'Testing Google Calendar API integration.',
  startTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min from now
  endTime: new Date(Date.now() + 35 * 60 * 1000).toISOString(), 
  attendees: [{ email: "nauman.samejaa@gmail.com" }]
   // 35 min from now
});

// const start = new Date('2025-07-03T00:00:00.000Z').toISOString(); // Start of the day in UTC
// const end = new Date('2025-07-03T23:59:59.000Z').toISOString();   // End of the day in UTC

// console.log({ start, end });



// getEventsInRange(start, end)
//   .then(events => {
//     // You can now show, filter, or analyze these events
//   })
//   .catch(console.error);