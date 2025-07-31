const { ChatOpenAI, OpenAIEmbeddings } = require("@langchain/openai");
const { Pinecone } = require("@pinecone-database/pinecone");
const { PineconeStore } = require("@langchain/community/vectorstores/pinecone");
const { RetrievalQAChain } = require("langchain/chains");
const { PromptTemplate } = require("@langchain/core/prompts");
const dotenv = require("dotenv");
dotenv.config();

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

const runQueryChain = async ({query}) => {

    const embeddings = new OpenAIEmbeddings({
        modelName: process.env.EMBEDDING_MODEL,
    });

    const llm = new ChatOpenAI({
        modelName: process.env.CHAT_MODEL,
        temperature: 0,
    });

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index,
        namespace: 'pdf-namespace',
        textKey: "text",
    });

    const retriever = vectorStore.asRetriever(Number(process.env.TOP_K_RESULTS || 4));

    // 🧠 Custom prompt: restrict to context only
    const prompt = PromptTemplate.fromTemplate(`
You are a helpful assistant. Use only the following context to answer the question. Try to use exact wording if possible.But try to extract the information from the document.
If the answer is not contained in the context, respond with:
"I could not find the answer in the document."

Context:
{context}

Question:
{question}
`);

    const chain = RetrievalQAChain.fromLLM(llm, retriever, {
        returnSourceDocuments: true,
        prompt,
    });

    const response = await chain.invoke({ query });
    return response;
};

module.exports = {
    runQueryChain,
};