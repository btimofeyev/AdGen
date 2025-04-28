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

// Upload image
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

  if (req.user) {
    try {
      const filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = `${Date.now()}_${req.file.originalname}`;
      const storagePath = `${req.user.id}/${fileName}`;

      // Upload to Supabase storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (storageError) {
        console.error('Supabase storage error:', storageError);
      } else {
        console.log('File uploaded to Supabase storage:', storagePath);

        // Save metadata to database
        const { data: metadataData, error: metadataError } = await supabase
          .from('user_images')
          .insert({
            user_id: req.user.id,
            storage_path: storagePath,
            original_filename: req.file.originalname,
            file_type: req.file.mimetype,
            metadata: {
              size: req.file.size,
              local_path: req.file.path
            }
          });

        if (metadataError) {
          console.error('Error saving image metadata:', metadataError);
        }
      }
    } catch (err) {
      console.error('Error uploading to Supabase:', err);
    }
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
    const outputPath = path.join(__dirname, '../uploads', outputFilename);
    
    fs.writeFileSync(outputPath, Buffer.from(generatedImage, 'base64'));
    
    let dbRecord = null;
    let storageUrl = null;
    
    if (userId) {
      const imageBuffer = Buffer.from(generatedImage, 'base64');
      const storagePath = `${userId}/generated/${outputFilename}`;
      
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
        
        // Save to user_images table
        const { data, error } = await supabase
          .from('user_images')
          .insert({
            user_id: userId,
            storage_path: storagePath,
            original_filename: outputFilename,
            file_type: 'image/png',
            metadata: {
              prompt,
              local_path: outputPath,
              size,
              quality
            }
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error saving to user_images:', error);
        } else {
          dbRecord = data;
          console.log('Saved to user_images with ID:', data.id);
        }
      }
      
      // Now check generated_images schema safely
      const { data: tableInfo, error: tableError } = await supabase
        .from('generated_images')
        .select('*')
        .limit(1);
      
      if (!tableError && Array.isArray(tableInfo) && tableInfo.length > 0) {
        try {
          const columnsToInsert = {
            user_id: userId,
            filepath: outputPath,
            filename: outputFilename,
            prompt
          };
          if (tableInfo[0].hasOwnProperty('base64_image')) {
            columnsToInsert.base64_image = generatedImage;
          }
          
          const { data: genData, error: genError } = await supabase
            .from('generated_images')
            .insert(columnsToInsert)
            .select()
            .single();
          
          if (genError) {
            console.error('Error saving to generated_images:', genError);
          } else {
            dbRecord = genData;
            console.log('Saved to generated_images with ID:', genData.id);
          }
        } catch (err) {
          console.error('Error in generated_images insert:', err);
        }
      }
    }
    
    return {
      id: dbRecord?.id,
      title,
      description: prompt,
      imageUrl: storageUrl || `/api/images/${outputFilename}`,
      base64Image: `data:image/png;base64,${generatedImage}`,
      storageUrl
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
    const outputPath = path.join(__dirname, '../uploads', outputFilename);
    
    fs.writeFileSync(outputPath, Buffer.from(generatedImage, 'base64'));
    
    let dbRecord = null;
    let storageUrl = null;
    
    if (userId) {
      const imageBuffer = Buffer.from(generatedImage, 'base64');
      const storagePath = `${userId}/generated/${outputFilename}`;
      
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
        
        const { data, error } = await supabase
          .from('user_images')
          .insert({
            user_id: userId,
            storage_path: storagePath,
            original_filename: outputFilename,
            file_type: 'image/png',
            metadata: {
              prompt,
              local_path: outputPath,
              size,
              quality
            }
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error saving to user_images:', error);
        } else {
          dbRecord = data;
          console.log('Saved to user_images with ID:', data.id);
        }
      }
      
      // Check generated_images for base64 column
      const { data: tableInfo, error: tableError } = await supabase
        .from('generated_images')
        .select('*')
        .limit(1);
      
      if (!tableError && Array.isArray(tableInfo) && tableInfo.length > 0) {
        try {
          const cols = {
            user_id: userId,
            filepath: outputPath,
            filename: outputFilename,
            prompt
          };
          if (tableInfo[0].hasOwnProperty('base64_image')) cols.base64_image = generatedImage;
          
          const { data: giData, error: giErr } = await supabase
            .from('generated_images')
            .insert(cols)
            .select()
            .single();
          
          if (giErr) {
            console.error('Error saving to generated_images:', giErr);
          } else {
            dbRecord = giData;
            console.log('Saved to generated_images with ID:', giData.id);
          }
        } catch (err) {
          console.error('Error in generated_images insert:', err);
        }
      }
    }
    
    return {
      id: dbRecord?.id,
      title,
      description: prompt,
      imageUrl: storageUrl || `/api/images/${outputFilename}`,
      base64Image: `data:image/png;base64,${generatedImage}`,
      storageUrl
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
    
    // Get images from user_images table
    const { data: userImagesData, error: userImagesError } = await supabase
      .from('user_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (userImagesError) {
      console.error('Error fetching user images:', userImagesError);
      return res.status(500).json({ error: 'Failed to fetch user images' });
    }

    // Check if generated_images table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('generated_images')
      .select('*')
      .limit(1);

    let generatedImagesData = [];
    if (!tableError && Array.isArray(tableInfo) && tableInfo.length > 0) {
      const { data: genData, error: genError } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (genError) {
        console.error('Error fetching generated images:', genError);
      } else {
        generatedImagesData = genData;
      }
    }

    // Process uploaded user_images
    const processedUserImages = await Promise.all(userImagesData.map(async img => {
      let base64Image = null;
      try {
        const { data: downloadData, error: downloadError } = await supabase
          .storage
          .from(BUCKET_NAME)
          .download(img.storage_path);
        if (!downloadError && downloadData) {
          const buf = Buffer.from(await downloadData.arrayBuffer());
          base64Image = buf.toString('base64');
        }
      } catch (err) {
        console.error('Error downloading user image:', err);
      }
      return {
        id: img.id,
        title: img.metadata?.title || 'Uploaded Image',
        description: img.metadata?.prompt || '',
        imageUrl: supabase.storage.from(BUCKET_NAME).getPublicUrl(img.storage_path).data.publicUrl,
        base64Image: base64Image ? `data:${img.file_type};base64,${base64Image}` : null,
        createdAt: img.created_at
      };
    }));

    // Process generated_images
    const processedGeneratedImages = generatedImagesData.map(img => {
      let base64Image = null;
      if (img.base64_image) {
        base64Image = img.base64_image;
      } else if (img.filepath && fs.existsSync(img.filepath)) {
        base64Image = fs.readFileSync(img.filepath).toString('base64');
      }
      return {
        id: img.id,
        title: img.filename,
        description: img.prompt,
        imageUrl: img.filepath.startsWith('http')
          ? img.filepath
          : `/api/images/${img.id}`,
        base64Image: base64Image ? `data:image/png;base64,${base64Image}` : null,
        createdAt: img.created_at
      };
    });

    // Combine and sort all images by date desc
    const allImages = [...processedUserImages, ...processedGeneratedImages]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      message: 'User images retrieved successfully',
      images: allImages
    });
  } catch (error) {
    console.error('Error in getUserImages:', error);
    return res.status(500).json({
      error: 'Failed to retrieve user images',
      details: error.message
    });
  }
};

const deleteUserImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Try deleting from user_images first
    const { data: ui, error: uiErr } = await supabase
      .from('user_images')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (!uiErr && ui) {
      await supabase.storage.from(BUCKET_NAME).remove([ui.storage_path]);
      await supabase.from('user_images').delete().eq('id', id);
      return res.status(200).json({ message: 'Image deleted successfully' });
    }

    // Fallback to generated_images
    const { data: gi, error: giErr } = await supabase
      .from('generated_images')
      .select('filepath')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (giErr || !gi) {
      return res.status(404).json({ error: 'Image not found' });
    }
    if (fs.existsSync(gi.filepath)) {
      fs.unlinkSync(gi.filepath);
    }
    await supabase.from('generated_images').delete().eq('id', id);
    return res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUserImage:', error);
    return res.status(500).json({
      error: 'Failed to delete image',
      details: error.message
    });
  }
};

const getSupabaseImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: img, error: imgErr } = await supabase
      .from('user_images')
      .select('storage_path, file_type')
      .eq('id', id)
      .single();
    if (imgErr || !img) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const { data: fileData, error: dlErr } = await supabase
      .storage
      .from(BUCKET_NAME)
      .download(img.storage_path);
    if (dlErr) {
      console.error('Error downloading image:', dlErr);
      return res.status(500).json({ error: 'Failed to download image' });
    }
    res.setHeader('Content-Type', img.file_type || 'image/png');
    const buffer = Buffer.from(await fileData.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    console.error('Error in getSupabaseImage:', error);
    return res.status(500).json({
      error: 'Failed to retrieve image',
      details: error.message
    });
  }
};

const getThemesAndFormats = (req, res) => {
  res.json({ message: "Simplified version doesn't use themes or formats" });
};

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

module.exports = {
  uploadImage,
  generateMultipleAds,
  getUserImages,
  deleteUserImage,
  getSupabaseImage,
  getThemesAndFormats
};
