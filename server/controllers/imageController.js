// server/controllers/imageController.js
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const supabase = require('../lib/supabase');
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
    const { filepath, prompt, count = 1 } = req.body;
    const userId = req.user ? req.user.id : null;
    
    console.log('===== GENERATE IMAGES REQUEST =====');
    console.log('Filepath:', filepath);
    console.log('User prompt:', prompt);
    console.log('Number of images:', count);
    console.log('User ID:', userId || 'Not authenticated');
    console.log('===================================');
    
    if (!filepath && prompt) {
      return generateMultipleFromScratch(req, res);
    }
    
    if (filepath && !fs.existsSync(filepath)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    const fileName = path.basename(filepath);
    const mimeType = getMimeType(filepath);
    const imageBuffer = fs.readFileSync(filepath);
    const generationPromises = [];
    
    for (let i = 0; i < count; i++) {
      const imageFile = await OpenAI.toFile(imageBuffer, fileName, { type: mimeType });
      const userPrompt = prompt || 'Create a visually appealing advertisement featuring this image';
      
      console.log(`===== GENERATION REQUEST #${i+1} =====`);
      console.log('Full prompt being sent to OpenAI:', userPrompt);
      console.log('===================================');
      
      try {
        generationPromises.push(generateImage(
          imageFile,
          userPrompt,
          `Generated Image ${i+1}`,
          "1024x1024",
          "high",
          userId
        ));
      } catch (error) {
        console.error(`Error creating promise for image ${i+1}:`, error);
        generationPromises.push({ error: error.message });
      }
    }
    
    const results = await Promise.allSettled(generationPromises);
    const processedResults = results.map(result =>
      result.status === 'fulfilled' ? result.value : { error: result.reason.message || 'Failed to generate image' }
    );
    
    console.log('===== GENERATION RESULTS =====');
    console.log('Successful generations:', processedResults.filter(r => !r.error).length);
    console.log('Failed generations:', processedResults.filter(r => r.error).length);
    console.log('==============================');
    
    // After successful generation, clean up the temporary upload file
    try {
      if (filepath && fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        if (fs.existsSync(`${filepath}.meta`)) {
          fs.unlinkSync(`${filepath}.meta`);
        }
        console.log(`Temporary file cleaned up: ${filepath}`);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temporary file:', cleanupError);
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
    const { prompt, count = 1 } = req.body;
    const userId = req.user ? req.user.id : null;
    
    console.log('===== GENERATE FROM SCRATCH =====');
    console.log('User prompt:', prompt);
    console.log('Number of images:', count);
    console.log('User ID:', userId || 'Not authenticated');
    console.log('================================');
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for generation from scratch' });
    }
    
    const generationPromises = [];
    
    for (let i = 0; i < count; i++) {
      console.log(`===== SCRATCH GENERATION REQUEST #${i+1} =====`);
      console.log('Full prompt being sent to OpenAI:', prompt);
      console.log('=========================================');
      
      try {
        generationPromises.push(generateImageFromScratch(
          prompt,
          `Generated Image ${i+1}`,
          "1024x1024",
          "high",
          userId
        ));
      } catch (error) {
        console.error(`Error creating promise for image ${i+1}:`, error);
        generationPromises.push({ error: error.message });
      }
    }
    
    const results = await Promise.allSettled(generationPromises);
    const processedResults = results.map(result =>
      result.status === 'fulfilled' ? result.value : { error: result.reason.message || 'Failed to generate image' }
    );
    
    console.log('===== SCRATCH GENERATION RESULTS =====');
    console.log('Successful generations:', processedResults.filter(r => !r.error).length);
    console.log('Failed generations:', processedResults.filter(r => r.error).length);
    console.log('=====================================');
    
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
        
        // Save metadata to database
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
            }
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error saving to database:', error);
        } else {
          dbRecord = data;
          console.log('Saved to database with ID:', data.id);
        }
      }
    }
    
    return {
      id: dbRecord?.id,
      title,
      description: prompt,
      imageUrl: storageUrl,
      base64Image: `data:image/png;base64,${generatedImage}`,
      prompt
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
        
        // Save to database
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
            }
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error saving to database:', error);
        } else {
          dbRecord = data;
          console.log('Saved to database with ID:', data.id);
        }
      }
    }
    
    return {
      id: dbRecord?.id,
      title,
      description: prompt,
      imageUrl: storageUrl,
      base64Image: `data:image/png;base64,${generatedImage}`,
      prompt
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
        createdAt: img.created_at
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
      .select('storage_path, base64_image')
      .eq('id', id)
      .single();
    
    if (imgErr || !img) {
      return res.status(404).json({ error: 'Image not found' });
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

// Cleanup temporary files - this could be run via a cron job
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
          
          if (metadata.isTemporary && (now - metadata.uploadTime > TEMP_FILE_TTL)) {
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
  cleanupTemporaryFiles
};