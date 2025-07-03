const { ChatOpenAI } = require("@langchain/openai");
const { tool } = require("@langchain/core/tools");
const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph");
const { ToolNode } = require("@langchain/langgraph/prebuilt");
const z = require("zod");
const axios = require("axios");
const dotenv = require("dotenv");
const emailService = require('./emailService');
const queryService = require('./queryService');
const calendarService = require('./calendarService')


dotenv.config();
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });

const calendarEventTool = tool(
  async ({ summary, description, startTime, endTime, attendees }) => {
    try {
      const event = await calendarService.addEvent({ summary, description, startTime, endTime, attendees });
      return `Event created: ${event.htmlLink}`;
    } catch (err) {
      return "Failed to create the calendar event. Please check the details or try again later.";
    }
  },
  {
    name: "addCalendarEvent",
    description: "Schedule a new event in Google Calendar. Provide the title, description, start, and end time.",
    schema: z.object({
      summary: z.string().describe("Title of the calendar event"),
      description: z.string().describe("Details of the event"),
      startTime: z.string().describe("Start time in ISO format with timezone, e.g. 2025-07-03T14:00:00+05:00"),
      endTime: z.string().describe("End time in ISO format with timezone, e.g. 2025-07-03T15:00:00+05:00"),
     attendees: z
  .array(
    z.object({
      email: z.string().email().describe("Email of the attendee"),
      displayName: z.string().optional().describe("Name of the attendee"),
    })
  )
  .optional()
  .describe("List of attendees to invite to the event"),
    }),
  }
);


// --- Tool 1: Query from PDF ---
const queryTool = tool(

  async ({ question }) => {

    const res = await queryService.runQueryChain({ query: question });

    return res.text || "No answer found in the PDF.";
  },
  {
    name: "queryPDF",
    description: "Answer questions from uploaded PDF documents only. Do not answer from general knowledge.",
    schema: z.object({
      question: z.string().describe("The user's question related to PDF content."),
    }),
  }
);

// --- Tool 2: Send Email ---
const emailTool = tool(
  async ({ to, subject, text }) => {
    try {
      await emailService.sendEmail({ to, subject, text });
      return "Email sent.";
    } catch (err) {
      return "It seems there is an issue with sending the email. Please try again later or check the email address for any errors.";
    }
  },
  {
    name: "sendEmail",
    description: "Send an email with a subject and body to a given email address.",
    schema: z.object({
      to: z.string().email().describe("Recipient email"),
      subject: z.string().describe("Subject of the email"),
      text: z.string().describe("Body of the email"),
    }),
  }
);

const getEventsInRangeTool = tool(
  async ({ startTime, endTime }) => {
    try {
      const events = await calendarService.getEventsInRange(startTime, endTime);
      if (!events.length) return "No events found in this time range.";

      const formatted = events.map((event) => {
        const start = event.start?.dateTime || event.start?.date;
        const end = event.end?.dateTime || event.end?.date;
        return `📅 ${event.summary} (${start} → ${end})`;
      });

      return `Found ${events.length} event(s):\n\n${formatted.join("\n")}`;
    } catch (err) {
      return "Failed to fetch calendar events. Please check the time range format.";
    }
  },
  {
    name: "getEventsInRange",
    description: "Get all calendar events between a given start and end time. Use ISO format with timezone offset.",
    schema: z.object({
      startTime: z
        .string()
        .describe("Start of the time range in ISO 8601 format with timezone, e.g. 2025-07-03T00:00:00+05:00"),
      endTime: z
        .string()
        .describe("End of the time range in ISO 8601 format with timezone, e.g. 2025-07-03T23:59:59+05:00"),
    }),
  }
);

// --- Tools & LLM Setup ---
const tools = [queryTool, emailTool, calendarEventTool, getEventsInRangeTool];

const toolNode = new ToolNode(tools);

const llm = new ChatOpenAI({
  modelName: process.env.CHAT_MODEL || "gpt-4o",
  temperature: 0,
}).bindTools(tools);

// --- Node: LLM decides what to do ---
async function llmCall(state) {
  const systemPrompt = {
    role: "system",
    content: `
You are a strict assistant that must always use the tools provided.

When the user wants to add a calendar event:

1. Always use today's date unless the user specifies another day.
   - Today is ${today}.
2. Always set event time in the 'Asia/Karachi' timezone (UTC+05:00).
3. Always return ISO 8601 datetime strings with timezone offsets.
   - Example: "2025-07-03T14:00:00+05:00" (for 2:00 PM Pakistan time).
4. Do NOT use UTC time or 'Z' suffix (e.g., avoid "2025-07-03T14:00:00Z").
5. The event time must reflect the user's intended local time (e.g., if they say "2pm today", it should be 14:00 in Asia/Karachi). Write the name of attendees in an array of objects in the 
following format.
[
  { "email": "lead@example.com", "displayName": "Team Lead" },
  { "email": "designer@example.com" }
]

replace the emails with the emails given in the query. If there no attendee, keep the array empty. Add ony one event in a single query.

Do not respond with free text — always use the calendar tool.

If the user asks to send an email, use the 'emailTool'. the name of sender should be 'Nauman' and don't use any placeholders in the email. 
For generic questions, use the 'queryTool'.

If the user asks for their schedule, events, or availability between two times, use 'getEventsInRange'. Always require both start and end times in the query. Format them in ISO 8601 with +05:00 timezone.
`.trim()
  };


  const result = await llm.invoke([systemPrompt, ...state.messages]);

  return { messages: [result] };
}

// --- Routing logic ---
function shouldContinue(state) {
  const last = state.messages.at(-1);
  return last?.tool_calls?.length ? "tools" : "__end__";
}

// --- LangGraph Agent ---
const agentGraph = new StateGraph(MessagesAnnotation)
  .addNode("llmCall", llmCall)
  .addNode("tools", toolNode)
  .addEdge("__start__", "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, {
    tools: "tools",
    __end__: "__end__",
  })
  .addEdge("tools", "llmCall")
  .compile();

// --- Entrypoint ---
const runAgent = async (userMessageHistory) => {
  const result = await agentGraph.invoke({ messages: userMessageHistory });
  return result.messages.at(-1);
};
module.exports = {
  runAgent
};