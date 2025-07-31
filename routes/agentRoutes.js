const express = require("express");
const {agentController} = require('../controllers')

const router = express.Router();

router.post("/query", agentController.handleAgentQuery);

module.exports = router;
