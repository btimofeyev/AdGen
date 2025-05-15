// server/controllers/imageController.js
const fs = require('fs');
const path = require('path');
const { OpenAI, toFile } = require('openai'); // Import toFile
const supabase = require('../lib/supabase');
const { hasEnoughCredits, deductCredits, ensureUserHasCredits } = require('../utils/creditUtils');
const sharp = require('sharp');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const BUCKET_NAME = 'scenesnapai'; // Ensure this is your correct Supabase bucket name
const TEMP_FILE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms
const OPTIMIZED_IMAGE_FORMAT = 'webp';
const OPTIMIZED_IMAGE_QUALITY = {
    webp: 80,
    jpeg: 80,
    png: { quality: 80, compressionLevel: 9 }
};
const DEFAULT_MODEL_GENERATION = "gpt-image-1"; 
const DEFAULT_MODEL_EDIT = "gpt-image-1"; // For images.edit (DALL-E 2 was also an option)      

// --- Upload Endpoints ---

// This is for AdCreator reference images (saves locally temporarily)
const uploadImageForReference = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = req.file.path; // Path where multer saved the file
    fs.writeFileSync(`${filePath}.meta`, JSON.stringify({
        uploadTime: Date.now(),
        userID: (req.user && req.user.id) || 'anonymous',
        isTemporary: true 
    }));
    return res.status(200).json({
        message: 'Reference file uploaded successfully (locally).',
        filename: req.file.filename, 
        filepath: req.file.path    
    });
};

// Upload multiple images for AdCreator reference (saves locally temporarily)
const uploadMultipleImagesForReference = async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    const filePaths = [];
    const fileNames = [];
    for (const file of req.files) {
        const filePath = file.path;
        fs.writeFileSync(`${filePath}.meta`, JSON.stringify({
            uploadTime: Date.now(),
            userID: (req.user && req.user.id) || 'anonymous',
            isTemporary: true
        }));
        filePaths.push(filePath);
        fileNames.push(file.filename);
    }
    return res.status(200).json({
        message: 'Reference files uploaded successfully (locally).',
        filenames: fileNames,
        filepaths: filePaths
    });
};


// NEW: Upload image specifically for a social post, storing it in Supabase Storage
const uploadSocialPostImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded for social post.' });
    }
    if (!req.user || !req.user.id) {
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(401).json({ error: "User not authenticated." });
    }

    const userId = req.user.id;
    const file = req.file; 
    
    try {
        let imageBuffer = fs.readFileSync(file.path);
        const originalFileName = file.originalname;
        const originalSizeKb = Math.round(imageBuffer.length / 1024);

        let optimizedFilenameForStorage = originalFileName.replace(/[^\w.-]/g, '_').replace(/\.[^/.]+$/, "") + `_social_${Date.now()}.${OPTIMIZED_IMAGE_FORMAT}`;
        let contentType = `image/${OPTIMIZED_IMAGE_FORMAT}`;

        try {
            let sharpInstance = sharp(imageBuffer);
            if (OPTIMIZED_IMAGE_FORMAT === 'webp') {
                sharpInstance = sharpInstance.webp(OPTIMIZED_IMAGE_QUALITY.webp);
            } else if (OPTIMIZED_IMAGE_FORMAT === 'jpeg') {
                sharpInstance = sharpInstance.jpeg(OPTIMIZED_IMAGE_QUALITY.jpeg);
            } else { 
                sharpInstance = sharpInstance.png(OPTIMIZED_IMAGE_QUALITY.png);
                contentType = 'image/png'; 
                optimizedFilenameForStorage = originalFileName.replace(/[^\w.-]/g, '_').replace(/\.[^/.]+$/, "") + `_social_${Date.now()}.png`;
            }
            imageBuffer = await sharpInstance.toBuffer(); 
            console.log(`Social post image optimized: ${originalFileName} -> ${optimizedFilenameForStorage}, New size: ${Math.round(imageBuffer.length / 1024)}KB`);
        } catch (optError) {
            console.error(`Error optimizing social post image ${originalFileName}:`, optError);
            imageBuffer = fs.readFileSync(file.path); 
            contentType = file.mimetype; 
            optimizedFilenameForStorage = `${Date.now()}_${originalFileName.replace(/[^\w.-]/g, '_')}`;
        }

        const storagePath = `social_post_media/${userId}/${optimizedFilenameForStorage}`;

        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, imageBuffer, { contentType, upsert: false });

        if (storageError) {
            console.error("Error uploading social post image to Supabase Storage:", storageError);
            throw storageError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);

        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        if (fs.existsSync(`${file.path}.meta`)) fs.unlinkSync(`${file.path}.meta`);


        return res.status(200).json({
            message: 'Social post image uploaded successfully to cloud storage.',
            url: publicUrl,           
            filepath: storagePath,    
            filename: optimizedFilenameForStorage 
        });

    } catch (error) {
        console.error("Error in uploadSocialPostImage:", error);
        if (file && file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
             if (fs.existsSync(`${file.path}.meta`)) fs.unlinkSync(`${file.path}.meta`);
        }
        return res.status(500).json({ error: 'Failed to process social post image.', details: error.message });
    }
};


// --- Generation Endpoints ---

const generateWithMultipleReferences = async (req, res) => {
    try {
        const { filepaths, prompt, count = 1, size = "1024x1024", requestId: clientRequestId } = req.body;
        const qualityForDb = "auto"; // As gpt-image-1 edit might infer quality
        const userId = req.user ? req.user.id : null;
        const requestId = clientRequestId || `${userId || 'anon'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        if (userId) {
            await ensureUserHasCredits(userId);
            const hasCredits = await hasEnoughCredits(userId, count);
            if (!hasCredits) return res.status(402).json({ error: 'Insufficient credits', message: `You need ${count} credits.` });
        }

        if (!filepaths || !Array.isArray(filepaths) || filepaths.length === 0) return res.status(400).json({ error: 'Invalid file paths', message: 'At least one file path required.' });
        for (const filepath of filepaths) if (!fs.existsSync(filepath)) return res.status(400).json({ error: 'Invalid file path', message: `File ${filepath} not found.` });
        if (!prompt) return res.status(400).json({ error: 'Missing prompt', message: 'Prompt required.' });

        const generationPromises = Array.from({ length: count }, (_, i) =>
            _generateImageUsingReferences(filepaths, prompt, `Generated Image ${i + 1} (multi-ref)`, size, qualityForDb, userId, DEFAULT_MODEL_EDIT, true)
                .catch(error => {
                    console.error(`Error in _generateImageUsingReferences (multi-ref): ${error.message}`);
                    return { error: error.message || 'Failed to generate image task (multi-ref)' };
                })
        );

        const results = await Promise.allSettled(generationPromises);
        const processedResults = results.map(result => result.status === 'fulfilled' ? result.value : { error: (result.reason?.message) || 'Unknown generation error (multi-ref)' });
        
        if (userId) {
            const successfulCount = processedResults.filter(r => !r.error).length;
            if (successfulCount > 0) await deductCredits(userId, successfulCount, 'image_gen_multi_ref', { prompt, count: successfulCount, request_id: requestId, size });
        }
        filepaths.forEach(fp => markFileForCleanup(fp, userId));
        return res.status(200).json({ message: 'Multiple images generated (multi-ref)', results: processedResults });

    } catch (error) {
        console.error("Error in generateWithMultipleReferences endpoint:", error);
        return res.status(500).json({ error: 'Failed to generate images using multiple references', details: error.message });
    }
};

const generateMultipleAds = async (req, res) => { 
    try {
        const { filepath, prompt, count = 1, size = "1024x1024", quality = "standard", requestId: clientRequestId } = req.body;
        const userId = req.user ? req.user.id : null;
        const requestId = clientRequestId || `${userId || 'anon'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        if (userId) {
            await ensureUserHasCredits(userId);
            const hasCredits = await hasEnoughCredits(userId, count);
            if (!hasCredits) return res.status(402).json({ error: 'Insufficient credits', message: `You need ${count} credits.` });
        }

        if (!filepath && prompt) { 
            console.log("No filepath, calling generateMultipleFromScratch for request:", requestId);
            return generateMultipleFromScratch(req, res); 
        }
        if (filepath && !fs.existsSync(filepath)) {
             if (prompt) {
                console.log("Filepath invalid, calling generateMultipleFromScratch for request:", requestId);
                return generateMultipleFromScratch(req, res); 
             }
            return res.status(400).json({ error: 'Invalid file path', message: 'Reference file not found.' });
        }
        if (!prompt && filepath) { 
             return res.status(400).json({ error: 'Missing prompt', message: 'Prompt is required when providing a reference image for edits.' });
        }
        if (!prompt && !filepath) {
            return res.status(400).json({ error: 'Missing input', message: 'Please provide a prompt or an image.' });
        }

        console.log("Generating with single reference for request:", requestId);
        const qualityForDb = "auto"; 
        const generationPromises = Array.from({ length: count }, (_, i) =>
            _generateImageUsingReferences([filepath], prompt, `Generated Image ${i + 1} (single-ref)`, size, qualityForDb, userId, DEFAULT_MODEL_EDIT, false)
                .catch(error => {
                    console.error(`Error in _generateImageUsingReferences (single-ref): ${error.message}`);
                    return { error: error.message || 'Failed to generate image task (single-ref)' };
                })
        );

        const results = await Promise.allSettled(generationPromises);
        const processedResults = results.map(result => result.status === 'fulfilled' ? result.value : { error: (result.reason?.message) || 'Unknown generation error (single-ref)' });
        
        if (userId) {
            const successfulCount = processedResults.filter(r => !r.error).length;
            if (successfulCount > 0) await deductCredits(userId, successfulCount, 'image_gen_single_ref', { prompt, count: successfulCount, request_id: requestId, size });
        }
        if(filepath) markFileForCleanup(filepath, userId);
        return res.status(200).json({ message: 'Multiple images generated (single-ref)', results: processedResults });

    } catch (error) {
        console.error("Error in generateMultipleAds (single reference) endpoint:", error);
        return res.status(500).json({ error: 'Failed to generate images using single reference', details: error.message });
    }
};

const generateMultipleFromScratch = async (req, res) => {
    try {
        const { prompt, count = 1, size = "1024x1024", quality = "standard", requestId: clientRequestId } = req.body;
        const userId = req.user ? req.user.id : null;
        const requestId = clientRequestId || `${userId || 'anon'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        if (userId) {
            await ensureUserHasCredits(userId);
            const hasCredits = await hasEnoughCredits(userId, count);
            if (!hasCredits) return res.status(402).json({ error: 'Insufficient credits', message: `You need ${count} credits.` });
        }
        if (!prompt) return res.status(400).json({ error: 'Missing prompt', message: 'Prompt is required.' });

        console.log("Generating from scratch for request:", requestId);
        const generationPromises = Array.from({ length: count }, (_, i) =>
            _generateImageFromScratchInternal(prompt, `Generated Image ${i + 1} (scratch)`, size, quality, userId, DEFAULT_MODEL_GENERATION)
                .catch(error => {
                     console.error(`Error in _generateImageFromScratchInternal: ${error.message}`);
                    return { error: error.message || 'Failed to generate image task (scratch)' };
                })
        );

        const results = await Promise.allSettled(generationPromises);
        const processedResults = results.map(result => result.status === 'fulfilled' ? result.value : { error: (result.reason?.message) || 'Unknown generation error (scratch)' });
        
        if (userId) {
            const successfulCount = processedResults.filter(r => !r.error).length;
            if (successfulCount > 0) await deductCredits(userId, successfulCount, 'image_gen_scratch', { prompt, count: successfulCount, request_id: requestId, size, quality });
        }
        return res.status(200).json({ message: 'Multiple images generated (scratch)', results: processedResults });
    } catch (error) {
        console.error("Error in generateMultipleFromScratch endpoint:", error);
        return res.status(500).json({ error: 'Failed to generate images from scratch', details: error.message });
    }
};


// --- Internal Helper Functions for Generation ---

async function _generateImageUsingReferences(filepaths, prompt, title, size, qualityForDb, userId, model, isMultiReferenceContext) {
    console.log(`_generateImageUsingReferences called for title: ${title}, model: ${model}`);
    const imageFileObjects = await Promise.all(
        filepaths.map(async (fp) => {
            const fileName = path.basename(fp);
            let buffer = fs.readFileSync(fp);
            buffer = await optimizeReferenceImageBuffer(buffer, fileName); 
            return toFile(buffer, fileName, { type: getMimeType(fp) });
        })
    );

    console.log(`Calling OpenAI images.edit for "${title}" with ${imageFileObjects.length} reference(s).`);
    const result = await openai.images.edit({
        model: model, 
        image: imageFileObjects, 
        prompt: prompt,
        n: 1,
        size: size,
    });
    console.log(`OpenAI response received for "${title}"`);

    const rawB64OpenAI = result.data[0].b64_json;
    const modelUsed = model; 
    const originalFilename = `gen_${Date.now()}_${title.replace(/\s+/g, '_').substring(0,20)}.png`;
    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7);

    let finalReturnData = {
        title, description: prompt, imageUrl: null,
        base64Image: `data:image/png;base64,${rawB64OpenAI}`,
        prompt, created_at: new Date().toISOString(), expires_at: expiresAt.toISOString(), id: null,
        modelUsed
    };

    if (userId) {
        const imageData = await storeImageInSupabase(userId, originalFilename, rawB64OpenAI, prompt, size, qualityForDb, expiresAt, modelUsed, { referenceImagesCount: filepaths.length, useMultipleReferences: isMultiReferenceContext });
        finalReturnData = {
            ...finalReturnData,
            id: imageData.dbRecord ? imageData.dbRecord.id : null,
            imageUrl: imageData.storageUrl,
            base64Image: imageData.optimizedBase64Image || finalReturnData.base64Image,
            created_at: imageData.dbRecord ? imageData.dbRecord.created_at : finalReturnData.created_at,
        };
    }
    return finalReturnData;
}

async function _generateImageFromScratchInternal(prompt, title, size, quality, userId, model) {
    console.log(`_generateImageFromScratchInternal called for title: ${title}, model: ${model}, quality: ${quality}`);
    console.log(`Calling OpenAI images.generate for "${title}". Prompt: "${prompt.substring(0,50)}..."`);
    const result = await openai.images.generate({
        model: model, 
        prompt,
        n: 1,
        size,
        quality, 
        response_format: "b64_json", 
    });
    console.log(`OpenAI response received for "${title}" (scratch)`);

    const rawB64OpenAI = result.data[0].b64_json;
    const modelUsedActual = model; 
    const originalFilename = `gen_${Date.now()}_${title.replace(/\s+/g, '_').substring(0,20)}.png`;
    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7);

    let finalReturnData = {
        title, description: prompt, imageUrl: null,
        base64Image: `data:image/png;base64,${rawB64OpenAI}`,
        prompt, created_at: new Date().toISOString(), expires_at: expiresAt.toISOString(), id: null,
        modelUsed: modelUsedActual
    };

    if (userId) {
        const imageData = await storeImageInSupabase(userId, originalFilename, rawB64OpenAI, prompt, size, quality, expiresAt, modelUsedActual);
        finalReturnData = {
            ...finalReturnData,
            id: imageData.dbRecord ? imageData.dbRecord.id : null,
            imageUrl: imageData.storageUrl,
            base64Image: imageData.optimizedBase64Image || finalReturnData.base64Image,
            created_at: imageData.dbRecord ? imageData.dbRecord.created_at : finalReturnData.created_at,
        };
    }
    return finalReturnData;
}


// --- Store Image (with optimization) ---
async function storeImageInSupabase(userId, originalFilename, rawBase64ImageFromOpenAI, prompt, sizeParamFromRequest, qualityParamFromRequest, expiresAt, modelUsed = "unknown", additionalMetadata = {}) {
    try {
        let imageBuffer = Buffer.from(rawBase64ImageFromOpenAI, 'base64');
        const originalSizeKb = Math.round(imageBuffer.length / 1024);
        
        let optimizedFilename = originalFilename.replace(/[^\w.-]/g, '_').replace(/\.[^/.]+$/, "") + `.${OPTIMIZED_IMAGE_FORMAT}`;
        let contentType = `image/${OPTIMIZED_IMAGE_FORMAT}`;

        try {
            let sharpInstance = sharp(imageBuffer);
            if (OPTIMIZED_IMAGE_FORMAT === 'webp') {
                sharpInstance = sharpInstance.webp(OPTIMIZED_IMAGE_QUALITY.webp);
            } else if (OPTIMIZED_IMAGE_FORMAT === 'jpeg') {
                sharpInstance = sharpInstance.jpeg(OPTIMIZED_IMAGE_QUALITY.jpeg);
            } else { 
                sharpInstance = sharpInstance.png(OPTIMIZED_IMAGE_QUALITY.png);
                contentType = 'image/png'; 
                optimizedFilename = originalFilename.replace(/[^\w.-]/g, '_').replace(/\.[^/.]+$/, ".png");
            }
            imageBuffer = await sharpInstance.toBuffer();
            console.log(`Image optimized: ${originalFilename} -> ${optimizedFilename}, Orig: ${originalSizeKb}KB, New: ${Math.round(imageBuffer.length / 1024)}KB`);
        } catch (optError) {
            console.error(`Error optimizing image ${originalFilename}:`, optError);
            imageBuffer = Buffer.from(rawBase64ImageFromOpenAI, 'base64'); 
            optimizedFilename = originalFilename.replace(/[^\w.-]/g, '_'); // Sanitize original filename
            contentType = 'image/png'; 
        }

        const storagePath = `${userId}/generated/${Date.now()}_${optimizedFilename}`; // Add timestamp for uniqueness
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, imageBuffer, { contentType, upsert: false }); // upsert: false is safer

        if (storageError) {
            console.error("Supabase Storage Upload Error:", storageError);
            throw storageError;
        }

        const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

        const imageMetadataForDb = {
            original_size_kb: originalSizeKb,
            optimized_size_kb: Math.round(imageBuffer.length / 1024),
            format: contentType.split('/')[1],
            dimensions: sizeParamFromRequest, 
            openai_quality_setting: qualityParamFromRequest, 
            model: modelUsed, 
            generation_time: new Date().toISOString(),
            ...additionalMetadata
        };

        const optimizedBase64ForDB = imageBuffer.toString('base64');

        const { data, error: dbError } = await supabase
            .from('generated_images')
            .insert({
                user_id: userId,
                filename: optimizedFilename, // Store the (potentially extension-changed) optimized filename
                prompt,
                storage_path: storagePath,
                base64_image: optimizedBase64ForDB, 
                metadata: imageMetadataForDb,
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (dbError) {
            console.error("Supabase DB Insert Error:", dbError);
            throw dbError;
        }

        return {
            dbRecord: data,
            storageUrl: publicUrl,
            optimizedBase64Image: `data:${contentType};base64,${optimizedBase64ForDB}`
        };
    } catch (error) {
        console.error("Error in storeImageInSupabase:", error);
        return { 
            dbRecord: null, 
            storageUrl: null, 
            optimizedBase64Image: `data:image/png;base64,${rawBase64ImageFromOpenAI}` 
        };
    }
}

// --- Other Helper Functions ---
const getUserImages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: imagesData, error: fetchError } = await supabase
            .from('generated_images')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (fetchError) return res.status(500).json({ error: 'Failed to fetch user images' });

        const processedImages = imagesData.map(img => {
            const now = new Date();
            const expiresAt = new Date(img.expires_at);
            const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));
            const format = (img.metadata && img.metadata.format) || 'png'; 

            return {
                id: img.id,
                title: img.filename || 'Generated Image',
                description: img.prompt || '',
                imageUrl: img.storage_path ? supabase.storage.from(BUCKET_NAME).getPublicUrl(img.storage_path).data.publicUrl : null,
                base64Image: img.base64_image ? `data:image/${format};base64,${img.base64_image}` : null, 
                prompt: img.prompt,
                created_at: img.created_at,
                expires_at: img.expires_at,
                daysRemaining,
                expirationText: daysRemaining === 0 ? 'Expires today' : daysRemaining === 1 ? 'Expires tomorrow' : `Expires in ${daysRemaining} days`,
                isMultiReference: (img.metadata && img.metadata.useMultipleReferences) || false,
                referenceCount: (img.metadata && img.metadata.referenceImagesCount) || 1,
                metadata: img.metadata 
            };
        });
        return res.status(200).json({ message: 'User images retrieved', images: processedImages });
    } catch (error) {
        console.error("Error in getUserImages:", error);
        return res.status(500).json({ error: 'Failed to retrieve images', details: error.message });
    }
};

const deleteUserImage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { data: imageData, error: getError } = await supabase
            .from('generated_images')
            .select('storage_path')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (getError || !imageData) return res.status(404).json({ error: 'Image not found or not owned by user' });
        
        if (imageData.storage_path) {
            const { error: storageDeleteError } = await supabase.storage.from(BUCKET_NAME).remove([imageData.storage_path]);
            if (storageDeleteError) console.error("Error deleting from storage (proceeding):", storageDeleteError.message);
        }

        const { error: dbDeleteError } = await supabase.from('generated_images').delete().eq('id', id);
        if (dbDeleteError) return res.status(500).json({ error: 'Failed to delete image record', details: dbDeleteError.message });
        
        return res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error("Error in deleteUserImage:", error);
        return res.status(500).json({ error: 'Failed to delete image', details: error.message });
    }
};

const getSupabaseImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: img, error: imgErr } = await supabase
            .from('generated_images')
            .select('storage_path, base64_image, expires_at, metadata') 
            .eq('id', id)
            .single();

        if (imgErr || !img) return res.status(404).json({ error: 'Image not found' });
        if (new Date() > new Date(img.expires_at)) return res.status(410).json({ error: 'Image expired' });

        const contentType = (img.metadata && img.metadata.format) ? `image/${img.metadata.format}` : 'image/png';

        if (img.base64_image) { 
            const buffer = Buffer.from(img.base64_image, 'base64');
            res.setHeader('Content-Type', contentType);
            return res.send(buffer);
        }
        
        if (img.storage_path) {
            const { data: fileData, error: dlErr } = await supabase.storage.from(BUCKET_NAME).download(img.storage_path);
            if (dlErr) return res.status(500).json({ error: 'Failed to download image from storage' });
            const buffer = Buffer.from(await fileData.arrayBuffer());
            res.setHeader('Content-Type', contentType); 
            return res.send(buffer);
        }
        
        return res.status(404).json({ error: 'Image data not available' });

    } catch (error) {
        console.error("Error in getSupabaseImage:", error);
        return res.status(500).json({ error: 'Failed to retrieve image', details: error.message });
    }
};

const getThemesAndFormats = (req, res) => {
    res.json({
        themes: [ { id: 'modern', name: 'Modern & Clean' }, { id: 'luxury', name: 'Luxury & Premium' }, { id: 'playful', name: 'Playful & Fun' }, { id: 'natural', name: 'Natural & Organic' }, { id: 'tech', name: 'Tech & Innovative' } ],
        formats: [ { id: 'social', name: 'Social Media Post' }, { id: 'banner', name: 'Web Banner' }, { id: 'product', name: 'Product Showcase' }, { id: 'email', name: 'Email Header' } ]
    });
};

function getMimeType(filepath) {
    const ext = path.extname(filepath).toLowerCase();
    switch (ext) {
        case '.png': return 'image/png';
        case '.jpg': case '.jpeg': return 'image/jpeg';
        case '.webp': return 'image/webp';
        default: return 'application/octet-stream'; 
    }
}

async function optimizeReferenceImageBuffer(imageBuffer, originalFileName) {
    const MAX_REF_SIZE_BYTES = 4 * 1024 * 1024; 
    // DALL-E 2 Edit API requires PNG, square, and < 4MB.
    // gpt-image-1 edit is more flexible but still has size limits.
    // Let's aim for PNG and reasonable dimensions for compatibility.
    
    let needsProcessing = imageBuffer.length > MAX_REF_SIZE_BYTES;
    let currentFormat = '';
    let currentWidth = 0;
    let currentHeight = 0;

    try {
        const metadata = await sharp(imageBuffer).metadata();
        currentFormat = metadata.format;
        currentWidth = metadata.width;
        currentHeight = metadata.height;
        if (currentFormat !== 'png') needsProcessing = true; // OpenAI Edit often prefers PNG
        // For DALL-E 2, it must be square. gpt-image-1 is more flexible.
        // if (currentWidth !== currentHeight && DEFAULT_MODEL_EDIT === "dall-e-2") needsProcessing = true;

    } catch (metaError) {
        console.error(`Could not get metadata for ${originalFileName}, proceeding without initial format check. Error: ${metaError.message}`);
        needsProcessing = true; // Assume processing is needed if metadata fails
    }


    if (needsProcessing) {
        try {
            console.log(`Reference image ${originalFileName} [${currentFormat}, ${currentWidth}x${currentHeight}, ${Math.round(imageBuffer.length / 1024)}KB] requires processing.`);
            const optimizedBuffer = await sharp(imageBuffer)
                .resize({ 
                    width: 1024, // Max dimension for DALL-E 2 edit input
                    height: 1024, 
                    fit: 'inside', // To make it square for DALL-E 2, use 'cover' or 'contain' and then potentially extend/crop
                                  // For gpt-image-1 'inside' is fine to just reduce size if needed.
                    withoutEnlargement: true 
                }) 
                .png({ quality: 90 }) // Output as PNG
                .toBuffer();
            console.log(`Processed reference ${originalFileName} to PNG: ${Math.round(optimizedBuffer.length / 1024)}KB`);
            return optimizedBuffer;
        } catch (optError) {
            console.error(`Failed to process reference image ${originalFileName}:`, optError);
        }
    }
    return imageBuffer; 
}

function markFileForCleanup(filepath, userId) {
    if (!filepath || !fs.existsSync(filepath)) return;
    try {
        const metaFilePath = `${filepath}.meta`;
        const metadata = fs.existsSync(metaFilePath) ? JSON.parse(fs.readFileSync(metaFilePath, 'utf8')) : { uploadTime: Date.now(), userID: userId || 'anonymous', isTemporary: true };
        metadata.markedForCleanup = true;
        metadata.lastUsed = Date.now();
        fs.writeFileSync(metaFilePath, JSON.stringify(metadata));
    } catch (error) { console.error('Error marking file for cleanup:', error); }
}

const cleanupExpiredImages = async() => {
    const now = new Date().toISOString();
    try {
        const { data: expiredImages, error: fetchError } = await supabase.from('generated_images').select('id, storage_path').lt('expires_at', now);
        if (fetchError) { console.error("Error fetching expired images:", fetchError); return { success: false, error: fetchError, deletedCount: 0 }; }
        if (!expiredImages || expiredImages.length === 0) return { success: true, deletedCount: 0 };
        
        const storagePaths = expiredImages.filter(img => img.storage_path).map(img => img.storage_path);
        if (storagePaths.length > 0) {
            const { error: removeError } = await supabase.storage.from(BUCKET_NAME).remove(storagePaths);
            if (removeError) console.error("Error removing from storage during cleanup:", removeError);
        }
        
        const expiredIds = expiredImages.map(img => img.id);
        const { error: deleteDbError } = await supabase.from('generated_images').delete().in('id', expiredIds);
        if (deleteDbError) { console.error("Error deleting DB records for expired images:", deleteDbError); return { success: false, error: deleteDbError, deletedCount: 0 };}
        
        console.log(`Cleaned up ${expiredImages.length} expired images.`);
        return { success: true, deletedCount: expiredImages.length };
    } catch (error) { 
        console.error("General error in cleanupExpiredImages:", error);
        return { success: false, error, deletedCount: 0 }; 
    }
};

const cleanupTemporaryFiles = () => {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) { console.log("Uploads directory not found, skipping temp file cleanup."); return;}
    fs.readdir(uploadsDir, (err, files) => {
        if (err) { console.error('Error reading uploads directory:', err); return; }
        const now = Date.now(); const RECENT_USE_TTL = 15 * 60 * 1000; // Increased to 15 minutes
        let cleanedCount = 0;
        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            try {
                if (!fs.existsSync(filePath)) return; // File might have been cleaned by another concurrent process
                if (fs.statSync(filePath).isDirectory() || file.endsWith('.meta')) return;
            } catch (statErr) {
                return; 
            }

            const metaPath = path.join(uploadsDir, `${file}.meta`);
            if (fs.existsSync(metaPath)) {
                try {
                    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                    const lastUsedOrUpload = metadata.lastUsed || metadata.uploadTime;
                    if ((metadata.markedForCleanup && (now - lastUsedOrUpload > RECENT_USE_TTL)) || 
                        (metadata.isTemporary && (now - metadata.uploadTime > TEMP_FILE_TTL))) {
                        try { fs.unlinkSync(filePath); } catch (e) { console.warn(`Warn: Error unlinking file ${filePath}:`,e.message); }
                        try { fs.unlinkSync(metaPath); } catch (e) { console.warn(`Warn: Error unlinking meta ${metaPath}:`,e.message); }
                        cleanedCount++;
                    }
                } catch (err) { console.error(`Error checking/deleting temporary file ${file}:`, err); }
            } else { 
                 try {
                    const stats = fs.statSync(filePath);
                    if (now - stats.mtimeMs > TEMP_FILE_TTL) { // If no meta, delete after longer TTL
                        fs.unlinkSync(filePath);
                        cleanedCount++;
                    }
                 } catch (statErr) { /* ignore */ }
            }
        });
        if(cleanedCount > 0) console.log(`Cleaned up ${cleanedCount} temporary files from local ./uploads.`);
    });
};

module.exports = {
    uploadImage: uploadImageForReference,       
    uploadImages: uploadMultipleImagesForReference, 
    uploadSocialPostImage,                      
    generateMultipleAds, 
    generateWithMultipleReferences, 
    generateMultipleFromScratch, 
    getUserImages,
    deleteUserImage,
    getSupabaseImage,
    getThemesAndFormats,
    cleanupTemporaryFiles,
    cleanupExpiredImages
};