// server/controllers/imageController.js
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const dotenv = require('dotenv'); 
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
    const { filepath, prompt, count = 1 } = req.body;
    
    console.log('===== GENERATE IMAGES REQUEST =====');
    console.log('Filepath:', filepath);
    console.log('User prompt:', prompt);
    console.log('Number of images:', count);
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
          "Full Image",
          "1024x1024",
          "high"
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
    const { prompt, count = 1 } = req.body;
    
    console.log('===== GENERATE FROM SCRATCH =====');
    console.log('User prompt:', prompt);
    console.log('Number of images:', count);
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
          "Full Image",
          "1024x1024",
          "high"
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
async function generateImage(imageFile, prompt, title, description, size, quality) {
  try {
    console.log('===== GENERATING IMAGE WITH REFERENCE =====');
    console.log('Prompt sent to OpenAI API:', prompt);
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
    const outputPath = path.join(__dirname, '../uploads', `generated_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`);
    
    // Save the generated image
    fs.writeFileSync(outputPath, Buffer.from(generatedImage, 'base64'));
    
    return {
      title,
      description,
      imageUrl: `/api/images/${path.basename(outputPath)}`,
      base64Image: `data:image/png;base64,${generatedImage}`
    };
  } catch (error) {
    console.error(`Error generating image:`, error);
    throw error;
  }
}

// Helper function to generate a single image from scratch
async function generateImageFromScratch(prompt, title, description, size, quality) {
  try {
    console.log('===== GENERATING IMAGE FROM SCRATCH =====');
    console.log('Prompt sent to OpenAI API:', prompt);
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
    const outputPath = path.join(__dirname, '../uploads', `generated_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`);
    
    // Save the generated image
    fs.writeFileSync(outputPath, Buffer.from(generatedImage, 'base64'));
    
    return {
      title,
      description,
      imageUrl: `/api/images/${path.basename(outputPath)}`,
      base64Image: `data:image/png;base64,${generatedImage}`
    };
  } catch (error) {
    console.error(`Error generating image from scratch:`, error);
    throw error;
  }
}

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
  getThemesAndFormats: (req, res) => res.json({ message: "Simplified version doesn't use themes or formats" })
};