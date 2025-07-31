const express = require('express')
const router = express.Router();

router.use('/agent', require('./agentRoutes'));
router.use('/pdf', require('./pdfRoutes'));
module.exports = router;