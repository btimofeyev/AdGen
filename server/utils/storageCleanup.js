// server/utils/storageCleanup.js
const supabase = require('../lib/supabase');
const BUCKET_NAME = 'scenesnapai';

/**
 * Function to clean up storage files for a deleted user
 * @param {string} userId - The ID of the deleted user
 * @returns {Promise<Object>} - Result of the operation
 */
async function cleanupUserStorage(userId) {
  console.log(`Cleaning up storage for deleted user: ${userId}`);
  
  try {
    // 1. List all objects in storage with this user's prefix
    const { data: objectList, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`${userId}/`);
    
    if (listError) {
      console.error('Error listing user storage objects:', listError);
      return { success: false, error: listError };
    }
    
    if (!objectList || objectList.length === 0) {
      console.log(`No storage objects found for user ${userId}`);
      return { success: true, deletedCount: 0 };
    }
    
    // 2. Get paths of all objects to delete
    const objectPaths = objectList.map(obj => `${userId}/${obj.name}`);
    console.log(`Found ${objectPaths.length} objects to delete for user ${userId}`);
    
    // 3. Delete the objects
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(objectPaths);
    
    if (deleteError) {
      console.error('Error deleting user storage objects:', deleteError);
      return { success: false, error: deleteError };
    }
    
    console.log(`Successfully deleted ${objectPaths.length} storage objects for user ${userId}`);
    return { success: true, deletedCount: objectPaths.length };
  } catch (error) {
    console.error('Unexpected error in cleanupUserStorage:', error);
    return { success: false, error };
  }
}

/**
 * This function can be called from a webhook that listens to user deletion events
 * or can be scheduled to run periodically to clean up orphaned files
 */
async function cleanupOrphanedUserStorage() {
  try {
    // Get all user IDs that exist in auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return { success: false, error: usersError };
    }
    
    const validUserIds = new Set(users.users.map(user => user.id));
    
    // Get user directories in storage
    const { data: directories, error: dirError } = await supabase.storage
      .from(BUCKET_NAME)
      .list();
    
    if (dirError) {
      console.error('Error listing storage directories:', dirError);
      return { success: false, error: dirError };
    }
    
    // Filter for user directories that don't belong to existing users
    const orphanedDirectories = directories
      .filter(dir => dir.id && !validUserIds.has(dir.id));
    
    console.log(`Found ${orphanedDirectories.length} orphaned user directories`);
    
    // Clean up each orphaned directory
    for (const dir of orphanedDirectories) {
      await cleanupUserStorage(dir.id);
    }
    
    return { success: true, cleanedDirectories: orphanedDirectories.length };
  } catch (error) {
    console.error('Error in cleanupOrphanedUserStorage:', error);
    return { success: false, error };
  }
}

module.exports = {
  cleanupUserStorage,
  cleanupOrphanedUserStorage
};