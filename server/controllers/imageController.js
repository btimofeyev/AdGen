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
  "Exclusive Offer"
];

const platformFormats = [
  { name: "Instagram Post", size: "1080x1080" },
  { name: "Facebook Ad", size: "1200x628" },
  { name: "TikTok", size: "1080x1920" },
  { name: "Email Header", size: "600x200" },
  { name: "Web Banner", size: "728x90" }
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
    const { filepath, prompt, theme } = req.body;
    
    if (!filepath || !fs.existsSync(filepath)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    // Get the file extension to determine MIME type
    const fileExtension = path.extname(filepath).toLowerCase();
    let mimeType;
    
    switch (fileExtension) {
      case '.png':
        mimeType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
      default:
        return res.status(400).json({ 
          error: 'Unsupported file format. Please use PNG, JPEG, or WebP images.' 
        });
    }
    
    // Read the file as a buffer
    const imageBuffer = fs.readFileSync(filepath);
    
    // Use the OpenAI SDK's helper function to convert the buffer to a File object
    // You need to use the toFile function from the OpenAI SDK
    const { toFile } = require('openai');
    const imageFile = await toFile(imageBuffer, path.basename(filepath), { type: mimeType });
    
    // Prepare the prompt
    const fullPrompt = `Generate an advertisement for ${prompt || 'a product'}. ${theme ? `Theme: ${theme}.` : ''}`;
    
    // Call OpenAI API
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: fullPrompt,
      n: 1,
      size: "1024x1024",
      quality: "low"
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
    const { filepath, prompt, themes = [], count = 3 } = req.body;
    
    if (!filepath || !fs.existsSync(filepath)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    // Read the image file
    const imageBuffer = fs.readFileSync(filepath);
    
    // Use provided themes or select random ones from common themes
    const themesToUse = themes.length > 0 ? themes : 
      commonThemes.sort(() => 0.5 - Math.random()).slice(0, count);
    
    // Generate ads for each theme
    const generationPromises = themesToUse.map(async (theme) => {
      const fullPrompt = `Create a professional advertisement for ${prompt || 'a product'} with theme: ${theme}. Make it visually appealing with appropriate text and styling.`;
      
      try {
        const result = await openai.images.edit({
          model: "gpt-image-1",
          image: imageBuffer,
          prompt: fullPrompt,
          n: 1,
          size: "1024x1024",
          quality: "high"
        });
        
        const generatedImage = result.data[0].b64_json;
        const outputPath = path.join(__dirname, '../uploads', `generated_${theme.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`);
        
        // Save the generated image
        fs.writeFileSync(outputPath, Buffer.from(generatedImage, 'base64'));
        
        return {
          theme,
          imageUrl: `/api/images/${path.basename(outputPath)}`,
          base64Image: `data:image/png;base64,${generatedImage}`
        };
      } catch (error) {
        console.error(`Error generating image for theme "${theme}":`, error);
        return {
          theme,
          error: error.message
        };
      }
    });
    
    // Wait for all generation tasks to complete
    const results = await Promise.all(generationPromises);
    
    return res.status(200).json({
      message: 'Multiple ad images generated',
      results
    });
    
  } catch (error) {
    console.error('Error generating multiple images:', error);
    return res.status(500).json({ 
      error: 'Failed to generate images',
      details: error.message
    });
  }
};

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