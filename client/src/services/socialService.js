// client/src/services/socialService.js
import { API_URL } from '../config';
import supabase from '../lib/supabase';

/**
 * Service for interacting with social media API endpoints
 */
const socialService = {
  /**
   * Get social media post templates
   * @returns {Promise<Array>} List of post templates
   */
  async getTemplates() {
    try {
      const response = await fetch(`${API_URL}/social/templates`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch templates');
      }
      
      const data = await response.json();
      return data.templates;
    } catch (error) {
      console.error('Error fetching social media templates:', error);
      throw error;
    }
  },
  
  /**
   * Generate social media post ideas
   * @param {Object} params - Generation parameters
   * @param {string} params.theme - Predefined theme ID
   * @param {string} params.customTheme - Custom theme text
   * @param {Array} params.platforms - Array of platform IDs
   * @param {number} params.count - Number of posts to generate
   * @returns {Promise<Array>} Generated post ideas
   */
  async generatePosts({ theme, customTheme, platforms, count = 3 }) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to generate posts');
      }
      
      const response = await fetch(`${API_URL}/social/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          theme,
          customTheme,
          platforms,
          count
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate post ideas');
      }
      
      const data = await response.json();
      return data.posts;
    } catch (error) {
      console.error('Error generating social media posts:', error);
      throw error;
    }
  },
  
  /**
   * Schedule a social media post
   * @param {Object} post - Post data to schedule
   * @param {string} post.title - Post title
   * @param {string} post.content - Post content
   * @param {string} post.imagePrompt - Image prompt for AI generation
   * @param {string} scheduledDate - Date in YYYY-MM-DD format
   * @param {string} scheduledTime - Time in HH:MM format
   * @param {Array} platforms - Array of platform IDs
   * @returns {Promise<Object>} Scheduled post data
   */
  async schedulePost(post, scheduledDate, scheduledTime, platforms) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to schedule posts');
      }
      
      const response = await fetch(`${API_URL}/social/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          postId: post.id,
          title: post.title,
          content: post.content,
          imagePrompt: post.imagePrompt,
          scheduledDate,
          scheduledTime,
          platforms
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to schedule post');
      }
      
      const data = await response.json();
      return data.scheduledPost;
    } catch (error) {
      console.error('Error scheduling social media post:', error);
      throw error;
    }
  },
  
  /**
   * Get user's scheduled posts
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} List of scheduled posts
   */
  async getScheduledPosts(status = null) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to view scheduled posts');
      }
      
      let url = `${API_URL}/social/scheduled`;
      if (status) {
        url += `?status=${status}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch scheduled posts');
      }
      
      const data = await response.json();
      return data.scheduledPosts;
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      throw error;
    }
  },
  
  /**
   * Delete a scheduled post
   * @param {string} id - ID of post to delete
   * @returns {Promise<void>}
   */
  async deleteScheduledPost(id) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to delete posts');
      }
      
      const response = await fetch(`${API_URL}/social/scheduled/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete scheduled post');
      }
    } catch (error) {
      console.error('Error deleting scheduled post:', error);
      throw error;
    }
  },
  
  /**
   * Connect a social media account (mock implementation)
   * @param {string} platform - Platform ID
   * @returns {Promise<Object>} Connection result
   */
  async connectAccount(platform) {
    // This would typically redirect to OAuth flow
    // For now, we'll just return a mock success response
    return {
      success: true,
      platform,
      connected: true
    };
  },
  
  /**
   * Disconnect a social media account (mock implementation)
   * @param {string} platform - Platform ID
   * @returns {Promise<Object>} Disconnection result
   */
  async disconnectAccount(platform) {
    return {
      success: true,
      platform,
      connected: false
    };
  }
};

export default socialService;