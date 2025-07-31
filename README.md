# 🔧 AI Assistant Backend

This is the Node.js backend for the **AI Assistant App**, responsible for:

- 🔍 Answering questions from uploaded PDF documents using RAG (Retrieval-Augmented Generation)
- ✉️ Sending emails using Nodemailer
- 📅 Managing Google Calendar events
- 🧠 Powering the intelligent assistant flow via LangGraph

---

## 📦 Tech Stack

- **Node.js + Express** – API server
- **LangGraph + LangChain** – Tool-powered conversational AI
- **OpenAI** – Embedding and chat models
- **Pinecone** – Vector search index for PDF retrieval
- **Nodemailer** – Email service
- **Google Calendar API** – Event scheduling and retrieval
- **Multer** – File upload handling
- **Zod** – Schema validation for tools
- **dotenv** – Environment config


---

## 🔐 Environment Variables

Create a `.env` file in the root with the following:

```env
# Server
PORT=5000

# OpenAI
OPENAI_API_KEY=your-openai-key
CHAT_MODEL=gpt-4o
EMBEDDING_MODEL=text-embedding-3-small

# Pinecone
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=your-index-name
TOP_K_RESULTS=4

# Email
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=your-email-password

# Google Calendar OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost
GOOGLE_REFRESH_TOKEN=your-refresh-token

