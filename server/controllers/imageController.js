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

// Common ad themes and platforms
const commonThemes = [
  "Father's Day Sale",
  "Summer Clearance",
  "Back to School",
  "Holiday Special",
  "Flash Sale",
  "Weekend Deal",
  "New Arrival",
  "Limited Edition",
  "Exclusive Offer",
  "New Collection",
  "Seasonal Line",
  "Bundle Deal",
  "Free Gift",
  "Members Only",
  "Valentine's Day",
  "Summer Break", 
  "Holiday Season",
  "Summer Ready", 
  "Fall Favorites", 
  "Winter Essentials"
];

const platformFormats = [
  { name: "Instagram Post", size: "1080x1080" },
  { name: "Facebook Ad", size: "1200x628" },
  { name: "TikTok", size: "1080x1920" },
  { name: "Email Header", size: "600x200" },
  { name: "Web Banner", size: "728x90" },
  { name: "Instagram Story", size: "1080x1920" },
  { name: "LinkedIn Post", size: "1200x627" }
];

// Upload image
const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  return res.status(200).json({ 
    message: 'File uploaded successfully',
    filename: req.file.filename,
    filepath: req.file.path
  });
};

// Generate a single ad
const generateSingleAd = async (req, res) => {
  try {
    const { filepath, prompt, theme, format, quality = "high" } = req.body;
    
    if (!filepath || !fs.existsSync(filepath)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    // Read the file
    const imageBuffer = fs.readFileSync(filepath);
    
    // Create a proper file object for the OpenAI API
    const fileName = path.basename(filepath);
    const mimeType = getMimeType(filepath);
    
    // Use OpenAI's helper for creating a File object
    const { toFile } = OpenAI;
    const imageFile = await toFile(imageBuffer, fileName, { type: mimeType });
    
    // Prepare the prompt
    const fullPrompt = `Generate a professional ${format || 'advertisement'} featuring this image. ${prompt || ''} ${theme ? `Theme: ${theme}.` : ''}`;
    
    // Select image size based on format
    const imageSize = getImageSize(format);
    
    // Call OpenAI API
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: fullPrompt,
      n: 1,
      size: imageSize,
      quality: quality
    });
    
    // Process and return the result
    const generatedImage = result.data[0].b64_json;
    const outputPath = path.join(__dirname, '../uploads', `generated_${Date.now()}.png`);
    
    // Save the generated image
    fs.writeFileSync(outputPath, Buffer.from(generatedImage, 'base64'));
    
    return res.status(200).json({
      message: 'Image generated successfully',
      imageUrl: `/api/images/${path.basename(outputPath)}`,
      base64Image: `data:image/png;base64,${generatedImage}`
    });
    
  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message
    });
  }
};

// Generate multiple ads with different themes
const generateMultipleAds = async (req, res) => {
  try {
    const { filepath, prompt, themes = [], formats = [], count = 3, quality = "high" } = req.body;
    
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
    
    // Use provided themes or select random ones from common themes
    const themesToUse = themes.length > 0 ? themes : 
      commonThemes.sort(() => 0.5 - Math.random()).slice(0, count);
    
    // Use provided formats or select random ones
    const formatsToUse = formats.length > 0 ? formats :
      platformFormats.sort(() => 0.5 - Math.random()).slice(0, count)
        .map(format => format.name);
    
    // Generate ads for each theme and format combination
    const generationPromises = [];
    
    for (let i = 0; i < count; i++) {
      const theme = themesToUse[i % themesToUse.length];
      const format = formatsToUse[i % formatsToUse.length];
      
      // Create a fresh file object for each request
      const imageFile = await OpenAI.toFile(imageBuffer, fileName, { type: mimeType });
      
      const fullPrompt = `Create a professional ${format} for ${prompt || 'this product'} with theme: ${theme}. Make it visually appealing with appropriate text and styling.`;
      
      // Get appropriate size for this format
      const imageSize = getImageSize(format);
      
      try {
        generationPromises.push(generateImage(
          imageFile,
          fullPrompt,
          theme,
          format,
          imageSize,
          quality
        ));
      } catch (error) {
        console.error(`Error creating promise for theme "${theme}":`, error);
        generationPromises.push({
          theme,
          format,
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
          theme: themesToUse[index % themesToUse.length],
          format: formatsToUse[index % formatsToUse.length],
          error: result.reason.message || 'Failed to generate image'
        };
      }
    });
    
    return res.status(200).json({
      message: 'Multiple visual assets generated',
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
    const { prompt, themes = [], formats = [], count = 3, quality = "high" } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for generation from scratch' });
    }
    
    // Use provided themes or select random ones from common themes
    const themesToUse = themes.length > 0 ? themes : 
      commonThemes.sort(() => 0.5 - Math.random()).slice(0, count);
    
    // Use provided formats or select random ones
    const formatsToUse = formats.length > 0 ? formats :
      platformFormats.sort(() => 0.5 - Math.random()).slice(0, count)
        .map(format => format.name);
    
    // Generate images for each theme and format combination
    const generationPromises = [];
    
    for (let i = 0; i < count; i++) {
      const theme = themesToUse[i % themesToUse.length];
      const format = formatsToUse[i % formatsToUse.length];
      
      const fullPrompt = `Create a professional ${format} for ${prompt} with theme: ${theme}. Make it visually appealing with appropriate text and styling.`;
      
      // Get appropriate size for this format
      const imageSize = getImageSize(format);
      
      try {
        generationPromises.push(generateImageFromScratch(
          fullPrompt,
          theme,
          format,
          imageSize,
          quality
        ));
      } catch (error) {
        console.error(`Error creating promise for theme "${theme}":`, error);
        generationPromises.push({
          theme,
          format,
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
          theme: themesToUse[index % themesToUse.length],
          format: formatsToUse[index % formatsToUse.length],
          error: result.reason.message || 'Failed to generate image'
        };
      }
    });
    
    return res.status(200).json({
      message: 'Multiple visual assets generated',
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
async function generateImage(imageFile, prompt, theme, format, size, quality) {
  try {
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality || "medium"
    });
    
    const generatedImage = result.data[0].b64_json;
    const outputPath = path.join(__dirname, '../uploads', `generated_${theme.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`);
    
    // Save the generated image
    fs.writeFileSync(outputPath, Buffer.from(generatedImage, 'base64'));
    
    return {
      theme,
      format,
      imageUrl: `/api/images/${path.basename(outputPath)}`,
      base64Image: `data:image/png;base64,${generatedImage}`
    };
  } catch (error) {
    console.error(`Error generating image for theme "${theme}":`, error);
    throw error;
  }
}

// Helper function to generate a single image from scratch
async function generateImageFromScratch(prompt, theme, format, size, quality) {
  try {
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality || "medium"
    });
    
    const generatedImage = result.data[0].b64_json;
    const outputPath = path.join(__dirname, '../uploads', `generated_${theme.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`);
    
    // Save the generated image
    fs.writeFileSync(outputPath, Buffer.from(generatedImage, 'base64'));
    
    return {
      theme,
      format,
      imageUrl: `/api/images/${path.basename(outputPath)}`,
      base64Image: `data:image/png;base64,${generatedImage}`
    };
  } catch (error) {
    console.error(`Error generating image from scratch for theme "${theme}":`, error);
    throw error;
  }
}

// Helper function to determine image size based on format
function getImageSize(format) {
  if (!format) return "1024x1024"; // Default square
  
  const formatLower = format.toLowerCase();
  
  if (formatLower.includes('instagram') && formatLower.includes('story')) {
    return "1024x1536"; // Portrait for stories
  } else if (formatLower.includes('email') || formatLower.includes('banner')) {
    return "1536x1024"; // Landscape for banners/emails
  } else if (formatLower.includes('facebook')) {
    return "1536x1024"; // Landscape for Facebook posts
  } else if (formatLower.includes('linkedin')) {
    return "1536x1024"; // Landscape for LinkedIn
  } else if (formatLower.includes('tiktok')) {
    return "1024x1536"; // Portrait for TikTok
  }
  
  return "1024x1024"; // Default square format
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

// Get available themes and platform formats
const getThemesAndFormats = (req, res) => {
  return res.status(200).json({
    themes: commonThemes,
    platforms: platformFormats
  });
};

module.exports = {
  uploadImage,
  generateSingleAd,
  generateMultipleAds,
  getThemesAndFormats
};