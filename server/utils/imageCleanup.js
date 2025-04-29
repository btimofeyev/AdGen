// server/utils/imageCleanup.js
const supabase = require('../lib/supabase');
const BUCKET_NAME = 'scenesnapai';

async function cleanupExpiredImages() {
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
}

module.exports = { cleanupExpiredImages };