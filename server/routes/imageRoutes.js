// server/routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Routes
router.post('/upload', upload.single('image'), imageController.uploadImage);

// Use generateMultipleAds for both single and multiple generations
// For single image, just set count to 1
router.post('/generate', (req, res) => {
  // Ensure count is set to 1 for single image generation
  req.body.count = 1;
  return imageController.generateMultipleAds(req, res);
});

router.post('/generate/multiple', imageController.generateMultipleAds);
router.get('/themes-formats', imageController.getThemesAndFormats);

// Serve generated images
router.get('/images/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  } else {
    return res.status(404).json({ error: 'Image not found' });
  }
});

module.exports = router;