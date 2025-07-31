const fs = require("fs");
const path = require("path");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { PineconeStore } = require("@langchain/community/vectorstores/pinecone");
const { Pinecone } = require("@pinecone-database/pinecone");
require("dotenv").config(); // ✅ No need for import.meta

const processPdf = async (buffer, fileName) => {
  const tempPath = path.join(__dirname, "..", "temp", fileName);
  fs.mkdirSync(path.dirname(tempPath), { recursive: true });
  fs.writeFileSync(tempPath, buffer);
  const loader = new PDFLoader(tempPath);
  const docs = await loader.load();
  fs.unlinkSync(tempPath);

  docs.forEach((doc) => {
    doc.metadata.source = fileName;
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: Number(process.env.CHUNK_SIZE) || 1000,
    chunkOverlap: Number(process.env.CHUNK_OVERLAP) || 200,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  const embeddings = new OpenAIEmbeddings({
    modelName: process.env.EMBEDDING_MODEL,
  });

  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  await PineconeStore.fromDocuments(splitDocs, embeddings, {
    pineconeIndex: index,
    namespace: "pdf-namespace",
    textKey: "text",
  });

};

module.exports = { processPdf };
