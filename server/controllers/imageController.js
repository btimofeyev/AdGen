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

// Set the correct bucket name
const BUCKET_NAME = 'scenesnapai';

// This helps ensure temporary uploads get cleaned up regularly
const TEMP_FILE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

// Upload image - only temporarily for generation, not for storage
const uploadImage = async (req, res) => {
  console.log('===== UPLOAD IMAGE REQUEST =====');
  console.log('File details:', req.file ? {
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype
  } : 'No file');
  console.log('User:', req.user ? req.user.id : 'Unauthenticated');
  console.log('================================');

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Mark the file with the current timestamp for cleanup purposes
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

// Generate multiple ads with just the prompt and count
const generateMultipleAds = async (req, res) => {
  try {
    const { filepath, prompt, count = 1, requestId: clientRequestId } = req.body;
    const userId = req.user ? req.user.id : null;
    
    // Create a unique request ID to detect and avoid duplicate requests
    // Use client-provided ID if available
    const requestId = clientRequestId || `${userId || 'anon'}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    console.log(`===== GENERATE IMAGES REQUEST [${requestId}] =====`);
    console.log('Filepath:', filepath);
    console.log('User prompt:', prompt);
    console.log('Number of images:', count);
    console.log('User ID:', userId || 'Not authenticated');
    console.log('===================================');
    
    // Ensure user has a credit record if they're authenticated
    if (userId) {
      const ensured = await ensureUserHasCredits(userId);
      if (!ensured) {
        console.log('Failed to ensure user has credits');
      }
    }
    
    // Check if user has enough credits before proceeding
    if (userId) {
      const hasCredits = await hasEnoughCredits(userId, count);
      if (!hasCredits) {
        return res.status(402).json({ 
          error: 'Insufficient credits', 
          message: `You need ${count} credits to generate ${count} images.` 
        });
      }
    }
    
    // If no filepath provided but we have a prompt, generate from scratch
    if (!filepath && prompt) {
      console.log(`Redirecting to generateMultipleFromScratch with request ID ${requestId}`);
      return generateMultipleFromScratch(req, res);
    }
    
    if (filepath && !fs.existsSync(filepath)) {
      console.log(`File not found: ${filepath}. Redirecting to generateMultipleFromScratch.`);
      // If file not found but we have prompt, fall back to generating from scratch
      if (prompt) {
        return generateMultipleFromScratch(req, res);
      }
      return res.status(400).json({ error: 'Invalid file path', message: 'The specified file was not found. Please upload your image again.' });
    }
    
    const fileName = path.basename(filepath);
    const mimeType = getMimeType(filepath);
    const imageBuffer = fs.readFileSync(filepath);
    const generationPromises = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const imageFile = await OpenAI.toFile(imageBuffer, fileName, { type: mimeType });
        const userPrompt = prompt || 'Create a visually appealing advertisement featuring this image';
        
        console.log(`===== GENERATION REQUEST #${i+1} for request ${requestId} =====`);
        console.log('Full prompt being sent to OpenAI:', userPrompt);
        console.log('===================================');
        
        generationPromises.push(generateImage(
          imageFile,
          userPrompt,
          `Generated Image ${i+1}`,
          "1024x1024",
          "low",
          userId
        ));
      } catch (error) {
        console.error(`Error creating promise for image ${i+1}:`, error);
        generationPromises.push(Promise.resolve({ error: error.message }));
      }
    }
    
    const results = await Promise.allSettled(generationPromises);
    const processedResults = results.map(result =>
      result.status === 'fulfilled' ? result.value : { error: result.reason?.message || 'Failed to generate image' }
    );
    
    console.log(`===== GENERATION RESULTS for request ${requestId} =====`);
    console.log('Successful generations:', processedResults.filter(r => !r.error).length);
    console.log('Failed generations:', processedResults.filter(r => r.error).length);
    console.log('==============================');
    
    // Only deduct credits for successful generations
    if (userId) {
      const successfulCount = processedResults.filter(r => !r.error).length;
      if (successfulCount > 0) {
        console.log(`===== CREDIT DEDUCTION ATTEMPT for request ${requestId} =====`);
        console.log(`User ID: ${userId}`);
        console.log(`Deducting ${successfulCount} credits`);
        
        const deductionSuccess = await deductCredits(userId, successfulCount, 'image_generation', { 
          prompt, 
          count: successfulCount, 
          with_reference: true,
          success_rate: `${successfulCount}/${count}`,
          request_id: requestId
        });
        
        console.log(`Credits deduction ${deductionSuccess ? 'successful' : 'failed'} for ${successfulCount} images`);
        console.log(`===== END CREDIT DEDUCTION =====`);
      }
    }
    
    // After successful generation, mark the file for cleanup instead of immediately deleting it
    try {
      if (filepath && fs.existsSync(filepath)) {
        // Instead of deleting immediately, update metadata to mark for cleanup
        const metaFilePath = `${filepath}.meta`;
        if (fs.existsSync(metaFilePath)) {
          const metadata = JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
          metadata.markedForCleanup = true;
          metadata.lastUsed = Date.now();
          fs.writeFileSync(metaFilePath, JSON.stringify(metadata));
          console.log(`Temporary file marked for cleanup: ${filepath}`);
        } else {
          // If meta file doesn't exist, create one
          fs.writeFileSync(metaFilePath, JSON.stringify({
            uploadTime: Date.now(),
            lastUsed: Date.now(),
            userID: userId || 'anonymous',
            isTemporary: true,
            markedForCleanup: true
          }));
        }
      }
    } catch (cleanupError) {
      console.error('Error marking file for cleanup:', cleanupError);
    }
    
    return res.status(200).json({
      message: 'Multiple images generated',
      results: processedResults
    });
    
  } catch (error) {
    console.error('Error generating multiple images:', error);
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
    
    // Create a unique request ID to detect and avoid duplicate requests
    // Use client-provided ID if available
    const requestId = clientRequestId || `${userId || 'anon'}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    console.log(`===== GENERATE FROM SCRATCH [${requestId}] =====`);
    console.log('User prompt:', prompt);
    console.log('Number of images:', count);
    console.log('User ID:', userId || 'Not authenticated');
    console.log('================================');
    
    // Ensure user has a credit record if they're authenticated
    if (userId) {
      const ensured = await ensureUserHasCredits(userId);
      if (!ensured) {
        console.log('Failed to ensure user has credits');
      }
    }
    
    // Check if user has enough credits before proceeding
    if (userId) {
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
        console.log(`===== SCRATCH GENERATION REQUEST #${i+1} for request ${requestId} =====`);
        console.log('Full prompt being sent to OpenAI:', prompt);
        console.log('=========================================');
        
        generationPromises.push(generateImageFromScratch(
          prompt,
          `Generated Image ${i+1}`,
          "1024x1024",
          "low",
          userId
        ));
      } catch (error) {
        console.error(`Error creating promise for image ${i+1}:`, error);
        generationPromises.push(Promise.resolve({ error: error.message }));
      }
    }
    
    const results = await Promise.allSettled(generationPromises);
    const processedResults = results.map(result =>
      result.status === 'fulfilled' ? result.value : { error: result.reason?.message || 'Failed to generate image' }
    );
    
    console.log(`===== SCRATCH GENERATION RESULTS for request ${requestId} =====`);
    console.log('Successful generations:', processedResults.filter(r => !r.error).length);
    console.log('Failed generations:', processedResults.filter(r => r.error).length);
    console.log('=====================================');
    
    // Only deduct credits for successful generations
    if (userId) {
      const successfulCount = processedResults.filter(r => !r.error).length;
      if (successfulCount > 0) {
        console.log(`===== CREDIT DEDUCTION ATTEMPT for request ${requestId} =====`);
        console.log(`User ID: ${userId}`);
        console.log(`Deducting ${successfulCount} credits`);
        
        const deductionSuccess = await deductCredits(userId, successfulCount, 'image_generation', { 
          prompt, 
          count: successfulCount, 
          with_reference: false,
          success_rate: `${successfulCount}/${count}`,
          request_id: requestId
        });
        
        console.log(`Credits deduction ${deductionSuccess ? 'successful' : 'failed'} for ${successfulCount} images`);
        console.log(`===== END CREDIT DEDUCTION =====`);
      }
    }
    
    return res.status(200).json({
      message: 'Multiple images generated',
      results: processedResults
    });
    
  } catch (error) {
    console.error('Error generating multiple images from scratch:', error);
    return res.status(500).json({ 
      error: 'Failed to generate images',
      details: error.message
    });
  }
};

// Helper function to generate a single image with reference image
async function generateImage(imageFile, prompt, title, size, quality, userId = null) {
  try {
    console.log('===== GENERATING IMAGE WITH REFERENCE =====');
    console.log('Prompt sent to OpenAI API:', prompt);
    console.log('User ID:', userId || 'Not authenticated');
    console.log('==========================================');
    
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt,
      n: 1,
      size,
      quality
    });
    
    console.log('===== IMAGE WITH REFERENCE RESULT =====');
    console.log('Generation successful:', !!result?.data?.[0]?.b64_json);
    console.log('======================================');
    
    const generatedImage = result.data[0].b64_json;
    const outputFilename = `generated_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    
    let dbRecord = null;
    let storageUrl = null;
    
    if (userId) {
      const imageBuffer = Buffer.from(generatedImage, 'base64');
      const storagePath = `${userId}/generated/${outputFilename}`;
      
      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Store in Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, imageBuffer, {
          contentType: 'image/png',
          upsert: false
        });
      
      if (storageError) {
        console.error('Error uploading to Supabase storage:', storageError);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath);
        
        storageUrl = publicUrl;
        
        // Save metadata to database with expiration
        const { data, error } = await supabase
          .from('generated_images')
          .insert({
            user_id: userId,
            filename: outputFilename,
            prompt,
            storage_path: storagePath,
            base64_image: generatedImage,
            metadata: {
              size,
              quality,
              model: "gpt-image-1",
              generation_time: new Date().toISOString()
            },
            expires_at: expiresAt.toISOString() // Add expiration date
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error saving to database:', error);
        } else {
          dbRecord = data;
          console.log('Saved to database with ID:', data.id);
          console.log('Image will expire on:', expiresAt.toISOString());
        }
      }
    }
    
    return {
      id: dbRecord?.id,
      title,
      description: prompt,
      imageUrl: storageUrl,
      base64Image: `data:image/png;base64,${generatedImage}`,
      prompt,
      created_at: dbRecord?.created_at || new Date().toISOString(),
      expires_at: dbRecord?.expires_at || expiresAt.toISOString()
    };
  } catch (error) {
    console.error(`Error generating image:`, error);
    throw error;
  }
}

// Helper function to generate a single image from scratch
async function generateImageFromScratch(prompt, title, size, quality, userId = null) {
  try {
    console.log('===== GENERATING IMAGE FROM SCRATCH =====');
    console.log('Prompt sent to OpenAI API:', prompt);
    console.log('User ID:', userId || 'Not authenticated');
    console.log('=========================================');
    
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size,
      quality
    });
    
    console.log('===== IMAGE FROM SCRATCH RESULT =====');
    console.log('Generation successful:', !!result?.data?.[0]?.b64_json);
    console.log('====================================');
    
    const generatedImage = result.data[0].b64_json;
    const outputFilename = `generated_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    
    let dbRecord = null;
    let storageUrl = null;
    
    if (userId) {
      const imageBuffer = Buffer.from(generatedImage, 'base64');
      const storagePath = `${userId}/generated/${outputFilename}`;
      
      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Store in Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, imageBuffer, {
          contentType: 'image/png',
          upsert: false
        });
      
      if (storageError) {
        console.error('Error uploading to Supabase storage:', storageError);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath);
        
        storageUrl = publicUrl;
        
        // Save to database with expiration
        const { data, error } = await supabase
          .from('generated_images')
          .insert({
            user_id: userId,
            filename: outputFilename,
            prompt,
            storage_path: storagePath,
            base64_image: generatedImage,
            metadata: {
              size,
              quality,
              model: "gpt-image-1",
              generation_time: new Date().toISOString()
            },
            expires_at: expiresAt.toISOString() // Add expiration date
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error saving to database:', error);
        } else {
          dbRecord = data;
          console.log('Saved to database with ID:', data.id);
          console.log('Image will expire on:', expiresAt.toISOString());
        }
      }
    }
    
    return {
      id: dbRecord?.id,
      title,
      description: prompt,
      imageUrl: storageUrl,
      base64Image: `data:image/png;base64,${generatedImage}`,
      prompt,
      created_at: dbRecord?.created_at || new Date().toISOString(),
      expires_at: dbRecord?.expires_at || expiresAt.toISOString()
    };
  } catch (error) {
    console.error(`Error generating image from scratch:`, error);
    throw error;
  }
}

// Get user's images - Modified to only return generated images
const getUserImages = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Only get images from generated_images table 
    const { data: generatedImagesData, error: generatedImagesError } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (generatedImagesError) {
      console.error('Error fetching generated images:', generatedImagesError);
      return res.status(500).json({ error: 'Failed to fetch user images' });
    }

    // Process generated_images
    const processedImages = generatedImagesData.map(img => {
      // Calculate days remaining until expiration
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
    console.error('Error in getUserImages:', error);
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

    // Get the image data first
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
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([imageData.storage_path]);
      
      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue anyway to delete the database record
      }
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
    console.error('Error in deleteUserImage:', error);
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
      console.error('Error downloading image:', dlErr);
      return res.status(500).json({ error: 'Failed to download image' });
    }
    
    const buffer = Buffer.from(await fileData.arrayBuffer());
    res.setHeader('Content-Type', 'image/png');
    return res.send(buffer);
  } catch (error) {
    console.error('Error in getSupabaseImage:', error);
    return res.status(500).json({
      error: 'Failed to retrieve image',
      details: error.message
    });
  }
};

// Get themes and formats - Simple version for now
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
      console.error('Error fetching expired images:', fetchError);
      return { success: false, error: fetchError, deletedCount: 0 };
    }
    
    if (!expiredImages || expiredImages.length === 0) {
      console.log('No expired images found');
      return { success: true, deletedCount: 0 };
    }
    
    console.log(`Found ${expiredImages.length} expired images to delete`);
    
    // Extract storage paths for deletion
    const storagePaths = expiredImages
      .filter(img => img.storage_path)
      .map(img => img.storage_path);
    
    // Delete from storage if there are any paths
    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(storagePaths);
      
      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with DB deletion even if storage deletion failed
      } else {
        console.log(`Deleted ${storagePaths.length} images from storage`);
      }
    }
    
    // Delete from database
    const expiredIds = expiredImages.map(img => img.id);
    const { error: deleteError } = await supabase
      .from('generated_images')
      .delete()
      .in('id', expiredIds);
    
    if (deleteError) {
      console.error('Error deleting expired images from database:', deleteError);
      return { success: false, error: deleteError, deletedCount: 0 };
    }
    
    console.log(`Successfully deleted ${expiredImages.length} expired images`);
    return { success: true, deletedCount: expiredImages.length };
  } catch (error) {
    console.error('Error in cleanupExpiredImages:', error);
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
          
          // Check if file is marked for cleanup and hasn't been used in the last 5 minutes
          // or if it's an old file (over 24 hours)
          const RECENT_USE_TTL = 5 * 60 * 1000; // 5 minutes
          
          if ((metadata.markedForCleanup && (now - metadata.lastUsed > RECENT_USE_TTL)) || 
              (metadata.isTemporary && (now - metadata.uploadTime > TEMP_FILE_TTL))) {
            // Delete the file and its metadata
            fs.unlinkSync(filePath);
            fs.unlinkSync(metaPath);
            console.log(`Cleaned up temporary file: ${file}`);
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
  cleanupExpiredImages // Export the new function for scheduled jobs
};