const { pdfService } = require("../services");

const handlePdfUpload = async (req, res) => {
  try {
    const buffer = req.file.buffer;
    const fileName = req.file.originalname;

    await pdfService.processPdf(buffer, fileName);


    res.status(200).json({ message: 'PDF processed successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process PDF.' });
  }
};

module.exports = {handlePdfUpload}