const { HumanMessage } = require("@langchain/core/messages");
const {agentService} = require('../services')

const handleAgentQuery = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const result = await agentService.runAgent([new HumanMessage(query)]);

    res.status(200).json({ response: result.content });
  } catch (err) {
    res.status(500).json({ error: "Failed to process query" });
  }
};


module.exports = {handleAgentQuery};
