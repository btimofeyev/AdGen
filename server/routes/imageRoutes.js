// server/routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// --- Multer Configuration for File Uploads ---
const TEMP_UPLOADS_DIR = path.join(__dirname, '../uploads'); // Temporary local storage for reference images

// Ensure the uploads directory exists
if (!fs.existsSync(TEMP_UPLOADS_DIR)) {
  fs.mkdirSync(TEMP_UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp-randomString.originalExtension
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept common image types
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit (OpenAI Vision models can take larger images)
  fileFilter: fileFilter
});


router.get('/themes-formats', imageController.getThemesAndFormats);


router.post('/upload', optionalAuth, upload.single('image'), imageController.uploadImage); 
router.post('/upload-multiple', optionalAuth, upload.array('images', 4), imageController.uploadImages); // Max 4 reference images

router.post('/upload/social-post', verifyToken, upload.single('image'), imageController.uploadSocialPostImage);


router.post('/generate/multiple-references', optionalAuth, imageController.generateWithMultipleReferences);
router.post('/generate/multiple', optionalAuth, imageController.generateMultipleAds); // Handles single reference or from scratch generation

router.get('/user/images', verifyToken, imageController.getUserImages);
router.delete('/user/images/:id', verifyToken, imageController.deleteUserImage);

router.get('/images/supabase/:id', imageController.getSupabaseImage); 

router.get('/images/:filename', (req, res) => {
  const { filename } = req.params;
  
  // Basic security: Sanitize filename to prevent directory traversal
  const normalizedFilename = path.normalize(filename).replace(/^(\.\.(\/|\\|$))+/, '');
  if (normalizedFilename !== filename || filename.endsWith('.meta')) {
    return res.status(400).json({ error: 'Invalid filename or access denied.' });
  }

  const filePath = path.join(TEMP_UPLOADS_DIR, normalizedFilename);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  } else {
    return res.status(404).json({ error: 'Temporary local image not found.' });
  }
});

// Middleware to handle multer errors specifically (e.g., file size limit)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading.
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `File too large. Max size is ${upload.opts.limits.fileSize / (1024 * 1024)}MB.` });
    }
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  } else if (err) {
    // An unknown error occurred when uploading.
    if (err.message === 'Invalid file type. Only images are allowed.') {
        return res.status(400).json({ error: err.message });
    }
    console.error("Unhandled error in image routes:", err);
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
  next();
});

module.exports = router;