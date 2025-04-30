// server/controllers/imageController.js
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const supabase = require('../lib/supabase');
const { hasEnoughCredits, deductCredits, ensureUserHasCredits } = require('../utils/creditUtils');
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Constants
const BUCKET_NAME = 'scenesnapai';
const TEMP_FILE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

// Upload image for generation
const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Mark the file with timestamp for cleanup
  const filePath = req.file.path;
  fs.writeFileSync(`${filePath}.meta`, JSON.stringify({
    uploadTime: Date.now(),
    userID: req.user?.id || 'anonymous',
    isTemporary: true
  }));
  
  return res.status(200).json({ 
    message: 'File uploaded successfully',
    filename: req.file.filename,
    filepath: req.file.path
  });
};

// Generate multiple ads with prompt and count
const generateMultipleAds = async (req, res) => {
  try {
    const { filepath, prompt, count = 1, requestId: clientRequestId } = req.body;
    const userId = req.user ? req.user.id : null;
    
    // Create unique request ID
    const requestId = clientRequestId || `${userId || 'anon'}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Ensure user has credits if authenticated
    if (userId) {
      await ensureUserHasCredits(userId);
      
      const hasCredits = await hasEnoughCredits(userId, count);
      if (!hasCredits) {
        return res.status(402).json({ 
          error: 'Insufficient credits', 
          message: `You need ${count} credits to generate ${count} images.` 
        });
      }
    }
    
    // If no filepath but prompt exists, generate from scratch
    if (!filepath && prompt) {
      return generateMultipleFromScratch(req, res);
    }
    
    if (filepath && !fs.existsSync(filepath)) {
      // If file not found but prompt exists, fall back to generating from scratch
      if (prompt) {
        return generateMultipleFromScratch(req, res);
      }
      return res.status(400).json({ 
        error: 'Invalid file path', 
        message: 'The specified file was not found. Please upload your image again.' 
      });
    }
    
    const fileName = path.basename(filepath);
    const mimeType = getMimeType(filepath);
    const imageBuffer = fs.readFileSync(filepath);
    const generationPromises = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const imageFile = await OpenAI.toFile(imageBuffer, fileName, { type: mimeType });
        const userPrompt = prompt || 'Create a visually appealing advertisement featuring this image';
        
        generationPromises.push(generateImage(
          imageFile,
          userPrompt,
          `Generated Image ${i+1}`,
          "1024x1024",
          "low",
          userId
        ));
      } catch (error) {
        generationPromises.push(Promise.resolve({ error: error.message }));
      }
    }
    
    const results = await Promise.allSettled(generationPromises);
    const processedResults = results.map(result =>
      result.status === 'fulfilled' ? result.value : { error: result.reason?.message || 'Failed to generate image' }
    );
    
    // Deduct credits for successful generations
    if (userId) {
      const successfulCount = processedResults.filter(r => !r.error).length;
      if (successfulCount > 0) {
        await deductCredits(userId, successfulCount, 'image_generation', { 
          prompt, 
          count: successfulCount, 
          with_reference: true,
          success_rate: `${successfulCount}/${count}`,
          request_id: requestId
        });
      }
    }
    
    // Mark the file for cleanup
    markFileForCleanup(filepath, userId);
    
    return res.status(200).json({
      message: 'Multiple images generated',
      results: processedResults
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to generate images',
      details: error.message
    });
  }
};

// Generate multiple images from scratch (no reference image)
const generateMultipleFromScratch = async (req, res) => {
  try {
    const { prompt, count = 1, requestId: clientRequestId } = req.body;
    const userId = req.user ? req.user.id : null;
    
    const requestId = clientRequestId || `${userId || 'anon'}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Credit checks
    if (userId) {
      await ensureUserHasCredits(userId);
      
      const hasCredits = await hasEnoughCredits(userId, count);
      if (!hasCredits) {
        return res.status(402).json({ 
          error: 'Insufficient credits', 
          message: `You need ${count} credits to generate ${count} images.` 
        });
      }
    }
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for generation from scratch' });
    }
    
    const generationPromises = [];
    
    for (let i = 0; i < count; i++) {
      try {
        generationPromises.push(generateImageFromScratch(
          prompt,
          `Generated Image ${i+1}`,
          "1024x1024",
          "low",
          userId
        ));
      } catch (error) {
        generationPromises.push(Promise.resolve({ error: error.message }));
      }
    }
    
    const results = await Promise.allSettled(generationPromises);
    const processedResults = results.map(result =>
      result.status === 'fulfilled' ? result.value : { error: result.reason?.message || 'Failed to generate image' }
    );
    
    // Deduct credits for successful generations
    if (userId) {
      const successfulCount = processedResults.filter(r => !r.error).length;
      if (successfulCount > 0) {
        await deductCredits(userId, successfulCount, 'image_generation', { 
          prompt, 
          count: successfulCount, 
          with_reference: false,
          success_rate: `${successfulCount}/${count}`,
          request_id: requestId
        });
      }
    }
    
    return res.status(200).json({
      message: 'Multiple images generated',
      results: processedResults
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to generate images',
      details: error.message
    });
  }
};

// Generate image with reference
async function generateImage(imageFile, prompt, title, size, quality, userId = null) {
  try {
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt,
      n: 1,
      size,
      quality
    });
    
    const generatedImage = result.data[0].b64_json;
    const outputFilename = `generated_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    
    let dbRecord = null;
    let storageUrl = null;
    
    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    if (userId) {
      // Store in Supabase
      const imageData = await storeImageInSupabase(
        userId, 
        outputFilename, 
        generatedImage, 
        prompt, 
        size, 
        quality, 
        expiresAt
      );
      
      dbRecord = imageData.dbRecord;
      storageUrl = imageData.storageUrl;
    }
    
    return {
      id: dbRecord?.id,
      title,
      description: prompt,
      imageUrl: storageUrl,
      base64Image: `data:image/png;base64,${generatedImage}`,
      prompt,
      created_at: dbRecord?.created_at || new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    };
  } catch (error) {
    throw error;
  }
}

// Generate image from scratch
async function generateImageFromScratch(prompt, title, size, quality, userId = null) {
  try {
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size,
      quality
    });
    
    const generatedImage = result.data[0].b64_json;
    const outputFilename = `generated_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    
    let dbRecord = null;
    let storageUrl = null;
    
    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    if (userId) {
      // Store in Supabase
      const imageData = await storeImageInSupabase(
        userId, 
        outputFilename, 
        generatedImage, 
        prompt, 
        size, 
        quality, 
        expiresAt
      );
      
      dbRecord = imageData.dbRecord;
      storageUrl = imageData.storageUrl;
    }
    
    return {
      id: dbRecord?.id,
      title,
      description: prompt,
      imageUrl: storageUrl,
      base64Image: `data:image/png;base64,${generatedImage}`,
      prompt,
      created_at: dbRecord?.created_at || new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    };
  } catch (error) {
    throw error;
  }
}

// Helper function to store image in Supabase
async function storeImageInSupabase(userId, filename, base64Image, prompt, size, quality, expiresAt) {
  try {
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const storagePath = `${userId}/generated/${filename}`;
    
    // Upload to storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });
    
    if (storageError) {
      throw storageError;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);
    
    // Save to database
    const { data, error } = await supabase
      .from('generated_images')
      .insert({
        user_id: userId,
        filename,
        prompt,
        storage_path: storagePath,
        base64_image: base64Image,
        metadata: {
          size,
          quality,
          model: "gpt-image-1",
          generation_time: new Date().toISOString()
        },
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      dbRecord: data,
      storageUrl: publicUrl
    };
  } catch (error) {
    console.error('Error storing image in Supabase:', error);
    return { dbRecord: null, storageUrl: null };
  }
}

// Get user's images
const getUserImages = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: generatedImagesData, error: generatedImagesError } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (generatedImagesError) {
      return res.status(500).json({ error: 'Failed to fetch user images' });
    }

    // Process images with expiration info
    const processedImages = generatedImagesData.map(img => {
      const now = new Date();
      const expiresAt = new Date(img.expires_at);
      const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));
      
      return {
        id: img.id,
        title: img.filename || 'Generated Image',
        description: img.prompt || '',
        imageUrl: img.storage_path ? 
          supabase.storage.from(BUCKET_NAME).getPublicUrl(img.storage_path).data.publicUrl : 
          null,
        base64Image: img.base64_image ? 
          `data:image/png;base64,${img.base64_image}` : 
          null,
        prompt: img.prompt,
        created_at: img.created_at,
        expires_at: img.expires_at,
        daysRemaining: daysRemaining,
        expirationText: daysRemaining === 0 ? 'Expires today' : 
                        daysRemaining === 1 ? 'Expires tomorrow' : 
                        `Expires in ${daysRemaining} days`
      };
    });

    return res.status(200).json({
      message: 'User images retrieved successfully',
      images: processedImages
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to retrieve user images',
      details: error.message
    });
  }
};

// Delete a user image
const deleteUserImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get the image data
    const { data: imageData, error: getError } = await supabase
      .from('generated_images')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (getError) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Delete from storage if path exists
    if (imageData.storage_path) {
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([imageData.storage_path]);
    }
    
    // Delete the database record
    const { error: deleteError } = await supabase
      .from('generated_images')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (deleteError) {
      return res.status(500).json({ 
        error: 'Failed to delete image record',
        details: deleteError.message 
      });
    }
    
    return res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to delete image',
      details: error.message
    });
  }
};

// Get a specific image from Supabase storage
const getSupabaseImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: img, error: imgErr } = await supabase
      .from('generated_images')
      .select('storage_path, base64_image, expires_at')
      .eq('id', id)
      .single();
    
    if (imgErr || !img) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Check if image has expired
    const now = new Date();
    const expiresAt = new Date(img.expires_at);
    if (now > expiresAt) {
      return res.status(410).json({ error: 'Image has expired and is no longer available' });
    }
    
    // If we have base64_image data directly in the DB, use it
    if (img.base64_image) {
      const buffer = Buffer.from(img.base64_image, 'base64');
      res.setHeader('Content-Type', 'image/png');
      return res.send(buffer);
    }
    
    // Otherwise fetch from storage
    const { data: fileData, error: dlErr } = await supabase
      .storage
      .from(BUCKET_NAME)
      .download(img.storage_path);
      
    if (dlErr) {
      return res.status(500).json({ error: 'Failed to download image' });
    }
    
    const buffer = Buffer.from(await fileData.arrayBuffer());
    res.setHeader('Content-Type', 'image/png');
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to retrieve image',
      details: error.message
    });
  }
};

// Get themes and formats
const getThemesAndFormats = (req, res) => {
  res.json({
    themes: [
      { id: 'modern', name: 'Modern & Clean' },
      { id: 'luxury', name: 'Luxury & Premium' },
      { id: 'playful', name: 'Playful & Fun' },
      { id: 'natural', name: 'Natural & Organic' },
      { id: 'tech', name: 'Tech & Innovative' }
    ],
    formats: [
      { id: 'social', name: 'Social Media Post' },
      { id: 'banner', name: 'Web Banner' },
      { id: 'product', name: 'Product Showcase' },
      { id: 'email', name: 'Email Header' }
    ]
  });
};

// Helper function to get MIME type from filepath
function getMimeType(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  switch (ext) {
    case '.png':  return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    default:      return 'application/octet-stream';
  }
}

// Mark file for cleanup
function markFileForCleanup(filepath, userId) {
  if (!filepath || !fs.existsSync(filepath)) return;
  
  try {
    const metaFilePath = `${filepath}.meta`;
    if (fs.existsSync(metaFilePath)) {
      const metadata = JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
      metadata.markedForCleanup = true;
      metadata.lastUsed = Date.now();
      fs.writeFileSync(metaFilePath, JSON.stringify(metadata));
    } else {
      fs.writeFileSync(metaFilePath, JSON.stringify({
        uploadTime: Date.now(),
        lastUsed: Date.now(),
        userID: userId || 'anonymous',
        isTemporary: true,
        markedForCleanup: true
      }));
    }
  } catch (error) {
    console.error('Error marking file for cleanup:', error);
  }
}

// Cleanup expired images - can be called from a scheduled job
const cleanupExpiredImages = async () => {
  console.log('Starting cleanup of expired generated images...');
  const now = new Date().toISOString();
  
  try {
    // Get expired images
    const { data: expiredImages, error: fetchError } = await supabase
      .from('generated_images')
      .select('id, storage_path')
      .lt('expires_at', now);
    
    if (fetchError) {
      return { success: false, error: fetchError, deletedCount: 0 };
    }
    
    if (!expiredImages || expiredImages.length === 0) {
      return { success: true, deletedCount: 0 };
    }
    
    // Extract storage paths for deletion
    const storagePaths = expiredImages
      .filter(img => img.storage_path)
      .map(img => img.storage_path);
    
    // Delete from storage if there are any paths
    if (storagePaths.length > 0) {
      await supabase.storage
        .from(BUCKET_NAME)
        .remove(storagePaths);
    }
    
    // Delete from database
    const expiredIds = expiredImages.map(img => img.id);
    await supabase
      .from('generated_images')
      .delete()
      .in('id', expiredIds);
    
    return { success: true, deletedCount: expiredImages.length };
  } catch (error) {
    return { success: false, error, deletedCount: 0 };
  }
};

// Cleanup temporary files
const cleanupTemporaryFiles = () => {
  const uploadsDir = path.join(__dirname, '../uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    return;
  }
  
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory:', err);
      return;
    }
    
    const now = Date.now();
    const RECENT_USE_TTL = 5 * 60 * 1000; // 5 minutes
    
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      // Skip directories and metadata files
      if (fs.statSync(filePath).isDirectory() || file.endsWith('.meta')) {
        return;
      }
      
      const metaPath = path.join(uploadsDir, `${file}.meta`);
      
      // Check if this is a temporary file
      if (fs.existsSync(metaPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          
          if ((metadata.markedForCleanup && (now - metadata.lastUsed > RECENT_USE_TTL)) || 
              (metadata.isTemporary && (now - metadata.uploadTime > TEMP_FILE_TTL))) {
            // Delete the file and its metadata
            fs.unlinkSync(filePath);
            fs.unlinkSync(metaPath);
          }
        } catch (err) {
          console.error(`Error checking temporary file ${file}:`, err);
        }
      }
    });
  });
};

module.exports = {
  uploadImage,
  generateMultipleAds,
  getUserImages,
  deleteUserImage,
  getSupabaseImage,
  getThemesAndFormats,
  cleanupTemporaryFiles,
  cleanupExpiredImages
};