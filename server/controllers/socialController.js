// server/controllers/socialController.js
const { OpenAI } = require('openai');
const supabase = require('../lib/supabase');
const { hasEnoughCredits, deductCredits } = require('../utils/creditUtils');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Generate social media post ideas
exports.generatePostIdeas = async (req, res) => {
    try {
        const { theme, customTheme, platforms, count = 3 } = req.body;
        const userId = req.user?.id;

        // Validate inputs
        if (!theme && !customTheme) {
            return res.status(400).json({
                error: 'Missing theme',
                message: 'Please provide a theme or customTheme'
            });
        }

        if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
            return res.status(400).json({
                error: 'Missing platforms',
                message: 'Please select at least one social media platform'
            });
        }

        // Check credits if user is authenticated
        if (userId) {
            // Each post costs 1 credit
            const hasCredits = await hasEnoughCredits(userId, count);
            if (!hasCredits) {
                return res.status(402).json({
                    error: 'Insufficient credits',
                    message: `You need ${count} credits to generate ${count} post ideas.`
                });
            }
        }

        // Format prompt based on theme and platforms
        const themeToUse = customTheme || theme;
        const platformsText = platforms.join(', ');
        
        const systemPrompt = `You are a professional social media manager creating engaging post ideas for small businesses. 
        Your task is to generate creative, effective social media content based on the provided theme.
        For each post, provide:
        1. A catchy title
        2. The actual post content (with appropriate hashtags)
        3. A detailed image prompt that can be used with AI image generators
        4. The best time to post (day and time)
        
        Format each post as a JSON object with fields: title, content, imagePrompt, bestTime.`;
        
        const userPrompt = `Create ${count} engaging social media post ideas for a "${themeToUse}" theme, 
        optimized for ${platformsText}. Include relevant hashtags and eye-catching content.`;

        // Request post ideas from OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        
        // Parse the response
        let postIdeas;
        try {
            const parsedResponse = JSON.parse(content);
            postIdeas = parsedResponse.posts || [];
            
            // Fallback handling if response format isn't as expected
            if (!postIdeas || !Array.isArray(postIdeas)) {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Error parsing OpenAI response:', err);
            return res.status(500).json({
                error: 'Failed to parse AI response',
                message: 'There was an issue with the post generation. Please try again.'
            });
        }

        // Deduct credits if user is authenticated
        if (userId && postIdeas.length > 0) {
            await deductCredits(userId, count, 'social_post_generation', {
                theme: themeToUse,
                count,
                platforms
            });
        }

        // Save generated posts to database if user is authenticated
        if (userId) {
            try {
                for (const post of postIdeas) {
                    await supabase.from('social_post_ideas').insert({
                        user_id: userId,
                        title: post.title,
                        content: post.content,
                        image_prompt: post.imagePrompt,
                        best_time: post.bestTime,
                        theme: themeToUse,
                        platforms,
                        created_at: new Date().toISOString()
                    });
                }
            } catch (err) {
                console.error('Error saving post ideas to database:', err);
                // Continue anyway - we don't want to fail the request if saving fails
            }
        }

        return res.status(200).json({
            message: 'Successfully generated post ideas',
            posts: postIdeas
        });

    } catch (error) {
        console.error('Error in generatePostIdeas:', error);
        return res.status(500).json({
            error: 'Failed to generate post ideas',
            message: error.message
        });
    }
};

// Schedule a social media post
exports.schedulePost = async (req, res) => {
    try {
        const { postId, title, content, imagePrompt, scheduledDate, scheduledTime, platforms } = req.body;
        const userId = req.user.id;

        if (!scheduledDate || !scheduledTime || !platforms || platforms.length === 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Please provide scheduledDate, scheduledTime, and platforms'
            });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(scheduledDate)) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Date should be in YYYY-MM-DD format'
            });
        }

        // Validate time format
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(scheduledTime)) {
            return res.status(400).json({
                error: 'Invalid time format',
                message: 'Time should be in HH:MM format'
            });
        }

        // Create a combined date-time string
        const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
        
        // Ensure the scheduled time is in the future
        const scheduledTimestamp = new Date(scheduledDateTime).getTime();
        const now = new Date().getTime();
        
        if (scheduledTimestamp <= now) {
            return res.status(400).json({
                error: 'Invalid scheduling time',
                message: 'Scheduled time must be in the future'
            });
        }

        // Create scheduled post entry
        const { data, error } = await supabase.from('scheduled_posts').insert({
            user_id: userId,
            post_id: postId, // Can be null if it's a custom post
            title: title,
            content: content,
            image_prompt: imagePrompt,
            scheduled_at: scheduledDateTime,
            platforms: platforms,
            status: 'scheduled',
            created_at: new Date().toISOString()
        }).select();

        if (error) {
            throw error;
        }

        return res.status(200).json({
            message: 'Post scheduled successfully',
            scheduledPost: data[0]
        });

    } catch (error) {
        console.error('Error in schedulePost:', error);
        return res.status(500).json({
            error: 'Failed to schedule post',
            message: error.message
        });
    }
};

// Get user's scheduled posts
exports.getScheduledPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let query = supabase
            .from('scheduled_posts')
            .select('*')
            .eq('user_id', userId)
            .order('scheduled_at', { ascending: true });

        // Filter by status if provided
        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return res.status(200).json({
            message: 'Scheduled posts retrieved successfully',
            scheduledPosts: data
        });

    } catch (error) {
        console.error('Error in getScheduledPosts:', error);
        return res.status(500).json({
            error: 'Failed to retrieve scheduled posts',
            message: error.message
        });
    }
};

// Delete a scheduled post
exports.deleteScheduledPost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify post belongs to user
        const { data, error } = await supabase
            .from('scheduled_posts')
            .select('id')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return res.status(404).json({
                error: 'Post not found',
                message: 'The scheduled post was not found or does not belong to you'
            });
        }

        // Delete the post
        const { error: deleteError } = await supabase
            .from('scheduled_posts')
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw deleteError;
        }

        return res.status(200).json({
            message: 'Scheduled post deleted successfully'
        });

    } catch (error) {
        console.error('Error in deleteScheduledPost:', error);
        return res.status(500).json({
            error: 'Failed to delete scheduled post',
            message: error.message
        });
    }
};

// Get social media post templates
exports.getPostTemplates = async (req, res) => {
    try {
        const templates = [
            { id: 'grand_opening', name: 'Grand Opening Sale', emoji: '🎉', description: 'Promote your store launch with special opening deals' },
            { id: 'seasonal_sale', name: 'Seasonal Sale', emoji: '🍂', description: 'Promote special discounts for seasonal events' },
            { id: 'new_product', name: 'New Product Launch', emoji: '✨', description: 'Announce and showcase your latest products' },
            { id: 'customer_testimonial', name: 'Customer Testimonial', emoji: '💬', description: 'Share positive feedback from your customers' },
            { id: 'behind_scenes', name: 'Behind The Scenes', emoji: '🎬', description: 'Show your business process and team' },
            { id: 'tips_tricks', name: 'Tips & How-To', emoji: '💡', description: 'Share helpful tips related to your products' },
            { id: 'holiday_special', name: 'Holiday Special', emoji: '🎄', description: 'Special promotions for holidays and events' },
            { id: 'flash_sale', name: 'Flash Sale', emoji: '⚡', description: 'Limited-time discounts to drive quick sales' }
        ];

        return res.status(200).json({
            message: 'Post templates retrieved successfully',
            templates
        });
    } catch (error) {
        console.error('Error in getPostTemplates:', error);
        return res.status(500).json({
            error: 'Failed to retrieve post templates',
            message: error.message
        });
    }
};

module.exports = exports;