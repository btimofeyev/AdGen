// server/routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, optionalAuth } = require('../middleware/auth');

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

// Set file size limit to 10MB
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Public routes
router.get('/themes-formats', imageController.getThemesAndFormats);

// Routes that work with optional authentication - Single file upload
router.post('/upload', optionalAuth, upload.single('image'), imageController.uploadImage);

// New route for multiple file uploads - up to 4 images
router.post('/upload-multiple', optionalAuth, upload.array('images', 4), imageController.uploadImages);

// Generation routes
router.post('/generate', optionalAuth, (req, res) => {
  req.body.count = 1;
  return imageController.generateMultipleAds(req, res);
});
router.post('/generate/multiple', optionalAuth, imageController.generateMultipleAds);

// New route for generating with multiple reference images
router.post('/generate/multiple-references', optionalAuth, imageController.generateWithMultipleReferences);

// Protected routes - require authentication
router.get('/user/images', verifyToken, imageController.getUserImages);
router.delete('/user/images/:id', verifyToken, imageController.deleteUserImage);

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

// Serve images from Supabase storage
router.get('/images/supabase/:id', verifyToken, imageController.getSupabaseImage);

module.exports = router;