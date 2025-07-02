const { ChatOpenAI } = require("@langchain/openai");
const { tool } = require("@langchain/core/tools");
const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph");
const { ToolNode } = require("@langchain/langgraph/prebuilt");
const z = require("zod");
const axios = require("axios");
const dotenv = require("dotenv");
const emailService = require('./emailService');
const queryService = require('./queryService');


dotenv.config();

// --- Tool 1: Query from PDF ---
const queryTool = tool(
    
  async ({ question }) => {
    // const res = await axios.post("http://localhost:5000/api/v1/query", { query: question });
    const res = await queryService.runQueryChain({query:question});

    return res.text|| "No answer found in the PDF.";
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
// --- Tools & LLM Setup ---
const tools = [queryTool, emailTool];
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
You are an assistant that must ALWAYS use the tools provided.
if the query is about sending emails, you must use 'emailTool' to send email. Otherwise use the tool 'queryTool'. do no create an answer by yourself. Your must only use tools provided.
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