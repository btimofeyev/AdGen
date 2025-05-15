// server/controllers/imageController.js
const fs = require('fs');
const path = require('path');
const { OpenAI, toFile } = require('openai');
const supabase = require('../lib/supabase');
const { hasEnoughCredits, deductCredits, ensureUserHasCredits } = require('../utils/creditUtils');
const sharp = require('sharp');

// --- Configuration ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME; 
const TEMP_UPLOADS_DIR = path.join(__dirname, '../uploads'); 
const TEMP_FILE_TTL_MS = 24 * 60 * 60 * 1000; 
const RECENT_USE_CLEANUP_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes for marked files
const OPTIMIZED_IMAGE_FORMAT = 'webp'; // 'webp', 'jpeg', or 'png'
const OPTIMIZED_IMAGE_QUALITY = { webp: 80, jpeg: 80, png: { quality: 80, compressionLevel: 6 } }; // Adjusted png compression
const DEFAULT_MODEL_GENERATION = "gpt-image-1"; // As per documentation focus
const DEFAULT_MODEL_EDIT = "gpt-image-1";     // Using gpt-image-1 for edits as per documentation

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// --- Helper Functions ---
const logError = (context, error, additionalInfo = "") => {
    console.error(`Error in ${context}: ${error.message}`, additionalInfo, error.stack ? `\nStack: ${error.stack.substring(0, 300)}...` : '');
};

const respondWithError = (res, message, statusCode = 500, details = "") => {
    // Avoid sending detailed stack traces or internal error messages to the client in production
    const clientMessage = process.env.NODE_ENV === 'production' && statusCode === 500 ? "An unexpected error occurred." : message;
    const clientDetails = process.env.NODE_ENV === 'production' && statusCode === 500 ? "" : details;
    return res.status(statusCode).json({ error: clientMessage, ...(clientDetails && { details: clientDetails }) });
};


const writeMetaFile = (filePath, userId, isTemporary = true) => {
    try {
        fs.writeFileSync(`${filePath}.meta`, JSON.stringify({ uploadTime: Date.now(), userID: userId || 'anonymous', isTemporary }));
    } catch (err) { logError('writeMetaFile', err, `Path: ${filePath}`); }
};

const cleanupLocalFile = (filePath) => {
    try {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        const metaPath = `${filePath}.meta`;
        if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    } catch (err) { logError('cleanupLocalFile', err, `Path: ${filePath}`); }
};

const optimizeImageBuffer = async (buffer, originalFileName, targetFormat = OPTIMIZED_IMAGE_FORMAT, qualitySettings = OPTIMIZED_IMAGE_QUALITY) => {
    let sharpInstance = sharp(buffer);
    let newContentType = `image/${targetFormat}`;
    let newFileName = originalFileName.replace(/[^\w.-]/g, '_').replace(/\.[^/.]+$/, `.${targetFormat}`);

    if (targetFormat === 'webp') sharpInstance = sharpInstance.webp(qualitySettings.webp);
    else if (targetFormat === 'jpeg') sharpInstance = sharpInstance.jpeg(qualitySettings.jpeg);
    else {
        sharpInstance = sharpInstance.png(qualitySettings.png);
        newContentType = 'image/png';
        newFileName = originalFileName.replace(/[^\w.-]/g, '_').replace(/\.[^/.]+$/, ".png");
    }
    const optimizedBuffer = await sharpInstance.toBuffer();
    // console.log(`Optimized ${originalFileName} to ${newFileName} (${Math.round(buffer.length/1024)}KB -> ${Math.round(optimizedBuffer.length/1024)}KB)`);
    return { buffer: optimizedBuffer, contentType: newContentType, fileName: newFileName };
};

const getMimeType = (filepathOrFilename) => {
    const ext = path.extname(filepathOrFilename).toLowerCase();
    const mimeTypes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
    return mimeTypes[ext] || 'application/octet-stream'; // Default binary stream
};

async function optimizeReferenceImageForOpenAI(buffer, originalFileName) {
    // gpt-image-1 is flexible; main concern is size. DALL-E 2 was stricter (PNG, square <4MB).
    // We'll resize if very large and ensure PNG for broad compatibility, though gpt-image-1 handles others.
    const MAX_REF_SIZE_BYTES = 15 * 1024 * 1024; // Increased limit for gpt-image-1, ~15MB (OpenAI docs suggest up to 20MB for vision)
    let processedBuffer = buffer;

    if (buffer.length > MAX_REF_SIZE_BYTES) {
        console.log(`Reference image ${originalFileName} [${Math.round(buffer.length / (1024*1024))}MB] too large, attempting resize.`);
        try {
            processedBuffer = await sharp(buffer)
                .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true }) // Resize to a max dimension
                .png({ quality: 90 }) // Convert to PNG for consistency, good quality
                .toBuffer();
            console.log(`Resized reference ${originalFileName} to ${Math.round(processedBuffer.length / 1024)}KB`);
            if (processedBuffer.length > MAX_REF_SIZE_BYTES) {
                 console.warn(`Reference image ${originalFileName} still too large after resize attempt.`);
                 // Could throw an error or try more aggressive compression
            }
        } catch (optError) {
            logError('optimizeReferenceImageForOpenAI (resize)', optError, `File: ${originalFileName}`);
            // Fallback to original buffer if optimization fails, API might still handle it or reject
        }
    }
    return processedBuffer;
}

const markFileForCleanup = (filepath, userId) => {
    if (!filepath || !fs.existsSync(filepath)) return;
    try {
        const metaFilePath = `${filepath}.meta`;
        const metadata = fs.existsSync(metaFilePath) ? JSON.parse(fs.readFileSync(metaFilePath, 'utf8')) : { uploadTime: Date.now(), userID: userId || 'anonymous', isTemporary: true };
        metadata.markedForCleanup = true;
        metadata.lastUsed = Date.now();
        fs.writeFileSync(metaFilePath, JSON.stringify(metadata));
    } catch (error) { logError('markFileForCleanup', error, `Path: ${filepath}`); }
};

const handleImageGenerationRequest = async (req, res, generationType) => {
    const userId = req.user?.id;
    const { filepaths, filepath, prompt, count = 1, size = "1024x1024", quality = "standard", requestId: clientRequestId } = req.body;
    const requestId = clientRequestId || `${userId || 'anon'}-${Date.now()}`;

    try {
        if (userId) {
            await ensureUserHasCredits(userId); // Ensures user record exists
            if (!(await hasEnoughCredits(userId, count))) {
                return respondWithError(res, `Insufficient credits. You need ${count}.`, 402);
            }
        }

        let generationFn;
        let localFilesToCleanup = [];
        let deductMeta = { prompt, count, request_id: requestId, size };

        switch (generationType) {
            case 'multi-reference':
                if (!filepaths?.length) return respondWithError(res, 'At least one file path required for multi-reference.', 400);
                for (const fp of filepaths) if (!fs.existsSync(fp)) return respondWithError(res, `File ${fp} not found.`, 400);
                if (!prompt) return respondWithError(res, 'Prompt required for multi-reference.', 400);
                generationFn = (idx) => _generateImageUsingReferencesInternal(filepaths, prompt, `Gen ${idx + 1}`, size, userId, DEFAULT_MODEL_EDIT, true);
                localFilesToCleanup = [...filepaths];
                deductMeta.type = 'image_gen_multi_ref';
                break;
            case 'single-reference': // This covers generateMultipleAds when filepath is present
                if (!filepath || !fs.existsSync(filepath)) return respondWithError(res, 'Valid reference file not found.', 400);
                if (!prompt) return respondWithError(res, 'Prompt required for single reference edit.', 400);
                generationFn = (idx) => _generateImageUsingReferencesInternal([filepath], prompt, `Gen ${idx + 1}`, size, userId, DEFAULT_MODEL_EDIT, false);
                localFilesToCleanup = [filepath];
                deductMeta.type = 'image_gen_single_ref';
                break;
            case 'scratch':
                if (!prompt) return respondWithError(res, 'Prompt is required for scratch generation.', 400);
                generationFn = (idx) => _generateImageFromScratchInternal(prompt, `Gen ${idx + 1}`, size, quality, userId, DEFAULT_MODEL_GENERATION);
                deductMeta.type = 'image_gen_scratch';
                deductMeta.quality = quality;
                break;
            default:
                return respondWithError(res, 'Invalid generation type.', 500);
        }

        const generationPromises = Array.from({ length: count }, (_, i) =>
            generationFn(i).catch(err => {
                logError(`generationFn type: ${generationType}`, err, `Index: ${i}`);
                return { error: err.message || `Failed to generate image task (${generationType})` };
            })
        );

        const results = await Promise.allSettled(generationPromises);
        const processedResults = results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason?.message || 'Unknown generation error' });
        
        if (userId) {
            const successfulCount = processedResults.filter(r => !r.error).length;
            if (successfulCount > 0) {
                deductMeta.count = successfulCount; // Deduct only for successful
                await deductCredits(userId, successfulCount, deductMeta.type, deductMeta);
            }
        }
        localFilesToCleanup.forEach(fp => markFileForCleanup(fp, userId));
        return res.status(200).json({ message: `Images generated (${generationType})`, results: processedResults });

    } catch (error) {
        logError(`handleImageGenerationRequest (${generationType})`, error);
        return respondWithError(res, `Failed to generate images (${generationType})`, 500, error.message);
    }
};

// --- Upload Endpoints ---
exports.uploadImage = async (req, res) => { // Single reference upload
    if (!req.file) return respondWithError(res, 'No file uploaded', 400);
    writeMetaFile(req.file.path, req.user?.id);
    return res.status(200).json({ message: 'Reference file uploaded locally.', filename: req.file.filename, filepath: req.file.path });
};

exports.uploadImages = async (req, res) => { // Multiple reference uploads
    if (!req.files?.length) return respondWithError(res, 'No files uploaded', 400);
    const uploads = req.files.map(file => {
        writeMetaFile(file.path, req.user?.id);
        return { filename: file.filename, filepath: file.path };
    });
    return res.status(200).json({ message: 'Reference files uploaded locally.', uploads });
};

exports.uploadSocialPostImage = async (req, res) => {
    if (!req.file) return respondWithError(res, 'No file uploaded for social post.', 400);
    if (!req.user?.id) {
        cleanupLocalFile(req.file.path);
        return respondWithError(res, "User not authenticated.", 401);
    }
    const { id: userId } = req.user;
    const { path: localPath, originalname } = req.file;
    try {
        const originalBuffer = fs.readFileSync(localPath);
        const { buffer: optimizedBuffer, contentType, fileName: optimizedFilenameForStorage } = await optimizeImageBuffer(originalBuffer, originalname);
        const storagePath = `social_post_media/${userId}/${Date.now()}_${optimizedFilenameForStorage}`;

        const { error: storageError } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, optimizedBuffer, { contentType, upsert: false });
        if (storageError) throw storageError;

        const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
        cleanupLocalFile(localPath);
        return res.status(200).json({ message: 'Social post image uploaded to cloud.', url: publicUrl, filepath: storagePath, filename: optimizedFilenameForStorage });
    } catch (error) {
        logError('uploadSocialPostImage', error);
        cleanupLocalFile(localPath);
        return respondWithError(res, 'Failed to process social post image.', 500, error.message);
    }
};

// --- Generation Endpoints ---
exports.generateWithMultipleReferences = (req, res) => handleImageGenerationRequest(req, res, 'multi-reference');
exports.generateMultipleAds = (req, res) => { // This used to be a hybrid, now it's cleaner
    if (req.body.filepath && fs.existsSync(req.body.filepath)) {
        return handleImageGenerationRequest(req, res, 'single-reference');
    }
    // If no valid filepath, or if prompt implies scratch generation
    return handleImageGenerationRequest(req, res, 'scratch');
};
exports.generateMultipleFromScratch = (req, res) => handleImageGenerationRequest(req, res, 'scratch');


// --- Internal Helper Functions for Actual OpenAI Calls & DB Storage ---
async function _generateImageUsingReferencesInternal(filepaths, prompt, title, size, userId, model, isMultiReferenceContext) {
    // console.log(`_generateImageUsingReferencesInternal: ${title}, Model: ${model}, MultiRef: ${isMultiReferenceContext}`);
    const imageFileObjects = await Promise.all(
        filepaths.map(async (fp) => {
            const fileName = path.basename(fp);
            let buffer = fs.readFileSync(fp);
            buffer = await optimizeReferenceImageForOpenAI(buffer, fileName); // Optimize for OpenAI
            return toFile(buffer, fileName, { type: getMimeType(fp) });
        })
    );

    const result = await openai.images.edit({ model, image: imageFileObjects, prompt, n: 1, size });
    const rawB64OpenAI = result.data[0].b64_json;
    return _processAndStoreGeneratedImage(userId, rawB64OpenAI, prompt, title, size, "auto", model, { referenceImagesCount: filepaths.length, useMultipleReferences: isMultiReferenceContext });
}

async function _generateImageFromScratchInternal(prompt, title, size, quality, userId, model) {
    // console.log(`_generateImageFromScratchInternal: ${title}, Model: ${model}, Quality: ${quality}`);
    const result = await openai.images.generate({ model, prompt, n: 1, size, quality, response_format: "b64_json" });
    const rawB64OpenAI = result.data[0].b64_json;
    return _processAndStoreGeneratedImage(userId, rawB64OpenAI, prompt, title, size, quality, model);
}

async function _processAndStoreGeneratedImage(userId, rawB64OpenAI, prompt, title, sizeParam, qualityParam, modelUsed, additionalMeta = {}) {
    const originalFilename = `gen_${Date.now()}_${title.replace(/\s+/g, '_').substring(0, 20)}.png`;
    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7);
    let finalReturnData = {
        title, prompt, base64Image: `data:image/png;base64,${rawB64OpenAI}`,
        created_at: new Date().toISOString(), expires_at: expiresAt.toISOString(), id: null, modelUsed
    };

    if (userId) {
        try {
            const imageData = await storeImageInSupabase(userId, originalFilename, rawB64OpenAI, prompt, sizeParam, qualityParam, expiresAt, modelUsed, additionalMeta);
            finalReturnData = {
                ...finalReturnData,
                id: imageData.dbRecord?.id,
                imageUrl: imageData.storageUrl, // This is the public Supabase URL
                base64Image: imageData.optimizedBase64Image || finalReturnData.base64Image, // Prefer optimized for direct return
                created_at: imageData.dbRecord?.created_at || finalReturnData.created_at,
            };
        } catch (storeError) {
            logError('_processAndStoreGeneratedImage (storeInSupabase)', storeError);
            // Return data with OpenAI's b64 even if Supabase store fails, so user at least gets image
        }
    }
    return finalReturnData;
}

async function storeImageInSupabase(userId, originalFilename, rawBase64ImageFromOpenAI, prompt, sizeParam, qualityParam, expiresAt, modelUsed, additionalMetadata = {}) {
    const originalBuffer = Buffer.from(rawBase64ImageFromOpenAI, 'base64');
    const { buffer: optimizedBuffer, contentType, fileName: optimizedFilename } = await optimizeImageBuffer(originalBuffer, originalFilename);
    
    const storagePath = `${userId}/generated/${Date.now()}_${optimizedFilename}`;
    const { error: storageError } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, optimizedBuffer, { contentType, upsert: false });
    if (storageError) { logError('storeImageInSupabase (storageUpload)', storageError); throw storageError; }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

    const imageMetadataForDb = {
        original_size_kb: Math.round(originalBuffer.length / 1024),
        optimized_size_kb: Math.round(optimizedBuffer.length / 1024),
        format: contentType.split('/')[1],
        dimensions: sizeParam, 
        openai_quality_setting: qualityParam, 
        model: modelUsed, 
        ...additionalMetadata
    };
    
    const optimizedBase64ForDBReturn = optimizedBuffer.toString('base64');

    const { data: dbRecord, error: dbError } = await supabase.from('generated_images').insert({
        user_id: userId, filename: optimizedFilename, prompt, storage_path: storagePath,
        base64_image: optimizedBase64ForDBReturn, // Store the optimized base64
        metadata: imageMetadataForDb, expires_at: expiresAt.toISOString()
    }).select().single();
    if (dbError) { logError('storeImageInSupabase (dbInsert)', dbError); throw dbError; }

    return { dbRecord, storageUrl: publicUrl, optimizedBase64Image: `data:${contentType};base64,${optimizedBase64ForDBReturn}` };
}

// --- Data Retrieval & Management Endpoints ---
exports.getUserImages = async (req, res) => {
    const userId = req.user?.id;
    try {
        const { data: imagesData, error: fetchError } = await supabase.from('generated_images').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (fetchError) throw fetchError;

        const processedImages = imagesData.map(img => {
            const now = new Date(); const expiresAt = new Date(img.expires_at);
            const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));
            const format = img.metadata?.format || 'png';
            return {
                id: img.id, title: img.filename || 'Generated Image', prompt: img.prompt,
                imageUrl: img.storage_path ? supabase.storage.from(BUCKET_NAME).getPublicUrl(img.storage_path).data.publicUrl : null,
                base64Image: img.base64_image ? `data:image/${format};base64,${img.base64_image}` : null, 
                created_at: img.created_at, expires_at: img.expires_at, daysRemaining, metadata: img.metadata,
                expirationText: daysRemaining <= 0 ? 'Expired' : daysRemaining === 1 ? 'Expires tomorrow' : `Expires in ${daysRemaining} days`,
            };
        });
        return res.status(200).json({ images: processedImages });
    } catch (error) {
        logError('getUserImages', error);
        return respondWithError(res, 'Failed to retrieve images', 500, error.message);
    }
};

exports.deleteUserImage = async (req, res) => {
    const userId = req.user?.id;
    const { id: imageId } = req.params;
    try {
        const { data: imageData, error: getError } = await supabase.from('generated_images').select('storage_path').eq('id', imageId).eq('user_id', userId).single();
        if (getError || !imageData) return respondWithError(res, 'Image not found or not authorized', 404);
        
        if (imageData.storage_path) {
            const { error: storageDelErr } = await supabase.storage.from(BUCKET_NAME).remove([imageData.storage_path]);
            if (storageDelErr) logError('deleteUserImage (storage)', storageDelErr, `Path: ${imageData.storage_path}`); // Log but proceed
        }
        const { error: dbDelErr } = await supabase.from('generated_images').delete().eq('id', imageId);
        if (dbDelErr) throw dbDelErr;
        return res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        logError('deleteUserImage', error, `ImageID: ${imageId}`);
        return respondWithError(res, 'Failed to delete image', 500, error.message);
    }
};

exports.getSupabaseImage = async (req, res) => { // For serving images directly if needed
    const { id: imageId } = req.params;
    try {
        const { data: img, error: imgErr } = await supabase.from('generated_images').select('storage_path, base64_image, expires_at, metadata').eq('id', imageId).single();
        if (imgErr || !img) return respondWithError(res, 'Image not found', 404);
        if (new Date() > new Date(img.expires_at)) return respondWithError(res, 'Image expired', 410);

        const contentType = img.metadata?.format ? `image/${img.metadata.format}` : 'image/png';
        if (img.base64_image) {
            res.setHeader('Content-Type', contentType);
            return res.send(Buffer.from(img.base64_image, 'base64'));
        }
        if (img.storage_path) { // Fallback to storage if no base64_image (e.g. if we stop storing it)
            const { data: fileData, error: dlErr } = await supabase.storage.from(BUCKET_NAME).download(img.storage_path);
            if (dlErr) return respondWithError(res, 'Failed to download image from storage', 500);
            res.setHeader('Content-Type', contentType);
            return res.send(Buffer.from(await fileData.arrayBuffer()));
        }
        return respondWithError(res, 'Image data not available', 404);
    } catch (error) {
        logError('getSupabaseImage', error, `ImageID: ${imageId}`);
        return respondWithError(res, 'Failed to retrieve image', 500, error.message);
    }
};

exports.getThemesAndFormats = (req, res) => { // Example, can be expanded
    res.json({
        themes: [ { id: 'modern', name: 'Modern' }, { id: 'luxury', name: 'Luxury' }, /* ... */ ],
        formats: [ { id: 'social', name: 'Social Post' }, { id: 'banner', name: 'Web Banner' }, /* ... */ ]
    });
};

// --- Cleanup Tasks ---
exports.cleanupExpiredImages = async() => { // Can be called by a cron job
    const now = new Date().toISOString();
    let deletedCount = 0;
    try {
        const { data: expiredImages, error: fetchError } = await supabase.from('generated_images').select('id, storage_path').lt('expires_at', now);
        if (fetchError) { logError("cleanupExpiredImages (fetch)", fetchError); return { success: false, deletedCount }; }
        if (!expiredImages?.length) return { success: true, deletedCount };
        
        const storagePaths = expiredImages.filter(img => img.storage_path).map(img => img.storage_path);
        if (storagePaths.length > 0) {
            const { error: removeError } = await supabase.storage.from(BUCKET_NAME).remove(storagePaths);
            if (removeError) logError("cleanupExpiredImages (storageRemove)", removeError); // Log, but try to delete DB records
        }
        
        const expiredIds = expiredImages.map(img => img.id);
        const { error: deleteDbError } = await supabase.from('generated_images').delete().in('id', expiredIds);
        if (deleteDbError) { logError("cleanupExpiredImages (dbDelete)", deleteDbError); return { success: false, deletedCount };}
        
        deletedCount = expiredImages.length;
        console.log(`Cleaned up ${deletedCount} expired images.`);
        return { success: true, deletedCount };
    } catch (error) { 
        logError("cleanupExpiredImages (general)", error);
        return { success: false, deletedCount }; 
    }
};

exports.cleanupTemporaryFiles = () => { // Can be called periodically
    if (!fs.existsSync(TEMP_UPLOADS_DIR)) return;
    let cleanedCount = 0;
    try {
        const files = fs.readdirSync(TEMP_UPLOADS_DIR);
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(TEMP_UPLOADS_DIR, file);
            try {
                if (fs.statSync(filePath).isDirectory() || file.endsWith('.meta')) return;
            } catch { return; } // File might have been deleted concurrently

            const metaPath = `${filePath}.meta`;
            if (fs.existsSync(metaPath)) {
                try {
                    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                    const lastUsedOrUpload = metadata.lastUsed || metadata.uploadTime;
                    if ((metadata.markedForCleanup && (now - lastUsedOrUpload > RECENT_USE_CLEANUP_THRESHOLD_MS)) || 
                        (metadata.isTemporary && (now - metadata.uploadTime > TEMP_FILE_TTL_MS))) {
                        cleanupLocalFile(filePath); // Uses helper that also cleans meta
                        cleanedCount++;
                    }
                } catch (err) { logError('cleanupTemporaryFiles (metaCheck)', err, `File: ${file}`); }
            } else { // No meta file, check mtime
                 try {
                    if (now - fs.statSync(filePath).mtimeMs > TEMP_FILE_TTL_MS) {
                        cleanupLocalFile(filePath);
                        cleanedCount++;
                    }
                 } catch { /* ignore */ }
            }
        });
        if (cleanedCount > 0) console.log(`Cleaned ${cleanedCount} temporary files from ${TEMP_UPLOADS_DIR}.`);
    } catch (err) { logError('cleanupTemporaryFiles (readDir)', err); }
};
