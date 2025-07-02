const express = require('express');
const multer = require('multer');
const {pdfController} = require('../controllers')

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // ✅ in-memory

router.post('/upload', upload.single('pdf'), pdfController.handlePdfUpload);

module.exports = router
