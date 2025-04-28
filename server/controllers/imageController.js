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

// Upload image
const uploadImage = (req, res) => {
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
  
  return res.status(200).json({ 
    message: 'File uploaded successfully',
    filename: req.file.filename,
    filepath: req.file.path
  });
};

// Generate multiple ads with just the prompt and count
const generateMultipleAds = async (req, res) => {
  try {
    const { filepath, prompt, count = 1, theme, format } = req.body;
    const userId = req.user ? req.user.id : null;
    
    console.log('===== GENERATE IMAGES REQUEST =====');
    console.log('Filepath:', filepath);
    console.log('User prompt:', prompt);
    console.log('Number of images:', count);
    console.log('User ID:', userId || 'Not authenticated');
    console.log('===================================');
    
    // If no filepath is provided but prompt is, we'll generate from scratch
    if (!filepath && prompt) {
      return generateMultipleFromScratch(req, res);
    }
    
    if (filepath && !fs.existsSync(filepath)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    // Get file info
    const fileName = path.basename(filepath);
    const mimeType = getMimeType(filepath);
    
    // Read the image file
    const imageBuffer = fs.readFileSync(filepath);
    
    // Generate ads with just the user prompt
    const generationPromises = [];
    
    for (let i = 0; i < count; i++) {
      // Create a fresh file object for each request
      const imageFile = await OpenAI.toFile(imageBuffer, fileName, { type: mimeType });
      
      // Use only the user's prompt, without adding themes or formats
      const userPrompt = prompt || 'Create a visually appealing advertisement featuring this image';
      
      console.log(`===== GENERATION REQUEST #${i+1} =====`);
      console.log('Full prompt being sent to OpenAI:', userPrompt);
      console.log('===================================');
      
      try {
        generationPromises.push(generateImage(
          imageFile,
          userPrompt,
          `Generated Image ${i+1}`,
          theme || "Full Image",
          "1024x1024",
          "high",
          userId
        ));
      } catch (error) {
        console.error(`Error creating promise for image ${i+1}:`, error);
        generationPromises.push({
          error: error.message
        });
      }
    }
    
    // Wait for all generation tasks to complete
    const results = await Promise.allSettled(generationPromises);
    
    // Process results
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          error: result.reason.message || 'Failed to generate image'
        };
      }
    });
    
    console.log('===== GENERATION RESULTS =====');
    console.log('Successful generations:', processedResults.filter(r => !r.error).length);
    console.log('Failed generations:', processedResults.filter(r => r.error).length);
    console.log('==============================');
    
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
    const { prompt, count = 1, theme, format } = req.body;
    const userId = req.user ? req.user.id : null;
    
    console.log('===== GENERATE FROM SCRATCH =====');
    console.log('User prompt:', prompt);
    console.log('Number of images:', count);
    console.log('User ID:', userId || 'Not authenticated');
    console.log('================================');
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for generation from scratch' });
    }
    
    // Generate images with just the user prompt
    const generationPromises = [];
    
    for (let i = 0; i < count; i++) {
      // Use only the user's prompt, without adding themes or formats
      const userPrompt = prompt;
      
      console.log(`===== SCRATCH GENERATION REQUEST #${i+1} =====`);
      console.log('Full prompt being sent to OpenAI:', userPrompt);
      console.log('=========================================');
      
      try {
        generationPromises.push(generateImageFromScratch(
          userPrompt,
          `Generated Image ${i+1}`,
          theme || "Full Image",
          "1024x1024",
          "high",
          userId
        ));
      } catch (error) {
        console.error(`Error creating promise for image ${i+1}:`, error);
        generationPromises.push({
          error: error.message
        });
      }
    }
    
    // Wait for all generation tasks to complete
    const results = await Promise.allSettled(generationPromises);
    
    // Process results
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          error: result.reason.message || 'Failed to generate image'
        };
      }
    });
    
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
async function generateImage(imageFile, prompt, title, theme, size, quality, userId = null) {
  try {
    console.log('===== GENERATING IMAGE WITH REFERENCE =====');
    console.log('Prompt sent to OpenAI API:', prompt);
    console.log('User ID:', userId || 'Not authenticated');
    console.log('==========================================');
    
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality || "high"
    });
    
    console.log('===== IMAGE WITH REFERENCE RESULT =====');
    console.log('Generation successful:', !!result?.data?.[0]?.b64_json);
    console.log('======================================');
    
    const generatedImage = result.data[0].b64_json;
    const outputFilename = `generated_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    const outputPath = path.join(__dirname, '../uploads', outputFilename);
    
    // Save the generated image
    fs.writeFileSync(outputPath, Buffer.from(generatedImage, 'base64'));
    
    // If user is authenticated, save record to database
    let dbRecord = null;
    if (userId) {
      const { data, error } = await supabase
        .from('generated_images')
        .insert({
          user_id: userId,
          filepath: outputPath,
          filename: outputFilename,
          prompt: prompt,
          theme: theme,
          base64_image: generatedImage
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
    
    return {
      id: dbRecord?.id,
      title,
      theme,
      description: prompt,
      imageUrl: `/api/images/${outputFilename}`,
      base64Image: `data:image/png;base64,${generatedImage}`
    };
  } catch (error) {
    console.error(`Error generating image:`, error);
    throw error;
  }
}

// Helper function to generate a single image from scratch
async function generateImageFromScratch(prompt, title, theme, size, quality, userId = null) {
  try {
    console.log('===== GENERATING IMAGE FROM SCRATCH =====');
    console.log('Prompt sent to OpenAI API:', prompt);
    console.log('User ID:', userId || 'Not authenticated');
    console.log('=========================================');
    
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality || "high"
    });
    
    console.log('===== IMAGE FROM SCRATCH RESULT =====');
    console.log('Generation successful:', !!result?.data?.[0]?.b64_json);
    console.log('====================================');
    
    const generatedImage = result.data[0].b64_json;
    const outputFilename = `generated_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    const outputPath = path.join(__dirname, '../uploads', outputFilename);
    
    // Save the generated image
    fs.writeFileSync(outputPath, Buffer.from(generatedImage, 'base64'));
    
    // If user is authenticated, save record to database
    let dbRecord = null;
    if (userId) {
      const { data, error } = await supabase
        .from('generated_images')
        .insert({
          user_id: userId,
          filepath: outputPath,
          filename: outputFilename,
          prompt: prompt,
          theme: theme,
          base64_image: generatedImage
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
    
    return {
      id: dbRecord?.id,
      title,
      theme,
      description: prompt,
      imageUrl: `/api/images/${outputFilename}`,
      base64Image: `data:image/png;base64,${generatedImage}`
    };
  } catch (error) {
    console.error(`Error generating image from scratch:`, error);
    throw error;
  }
}

// Get user's images
const getUserImages = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get images from Supabase
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user images:', error);
      return res.status(500).json({ error: 'Failed to fetch images' });
    }
    
    // Format the response
    const formattedImages = data.map(img => ({
      id: img.id,
      title: 'User Generated Image',
      theme: img.theme || 'Custom',
      description: img.prompt,
      imageUrl: `/api/images/${img.filename}`,
      base64Image: img.base64_image ? `data:image/png;base64,${img.base64_image}` : null,
      createdAt: img.created_at
    }));
    
    return res.status(200).json({
      message: 'User images retrieved successfully',
      images: formattedImages
    });
  } catch (error) {
    console.error('Error in getUserImages:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve user images',
      details: error.message
    });
  }
};

// Delete user image
const deleteUserImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get the image details first
    const { data: imageData, error: fetchError } = await supabase
      .from('generated_images')
      .select('filename, filepath')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching image details:', fetchError);
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Delete from the database
    const { error: deleteError } = await supabase
      .from('generated_images')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('Error deleting image from database:', deleteError);
      return res.status(500).json({ error: 'Failed to delete image' });
    }
    
    // Remove the file from filesystem if it exists
    if (imageData.filepath && fs.existsSync(imageData.filepath)) {
      fs.unlinkSync(imageData.filepath);
    }
    
    return res.status(200).json({
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteUserImage:', error);
    return res.status(500).json({ 
      error: 'Failed to delete image',
      details: error.message
    });
  }
};

// Helper function to get MIME type
function getMimeType(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    default: return 'image/png';
  }
}

module.exports = {
  uploadImage,
  generateMultipleAds,
  getUserImages,
  deleteUserImage,
  getThemesAndFormats: (req, res) => res.json({ message: "Simplified version doesn't use themes or formats" })
};