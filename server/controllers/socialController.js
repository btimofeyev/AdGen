// server/controllers/socialController.js
const { OpenAI } = require('openai');
const supabase = require('../lib/supabase');
const { hasEnoughCredits, deductCredits } = require('../utils/creditUtils'); // Assuming ensureUserHasCredits is handled within these or not strictly needed for this flow.

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const BUCKET_NAME = 'scenesnapai'; 

// Generate social media post ideas (Multimodal)
exports.generatePostIdeas = async (req, res) => {
    // Log only part of the body if imageUrl is present as it can be very long
    const logBody = { ...req.body };
    if (logBody.imageUrl) logBody.imageUrl = logBody.imageUrl.substring(0, 100) + "... (truncated)";
    console.log("==========================================");
    console.log("generatePostIdeas called with request body:", JSON.stringify(logBody));
    console.log("User ID:", req.user?.id);
    console.log("==========================================");
    
    try {
        const { 
            theme,             
            customTheme,       
            platforms, 
            count = 3,          // Default to 3 posts if not specified by client
            productName,       
            imageUrl           
        } = req.body;
        const userId = req.user?.id;

        if (!customTheme && !theme && !imageUrl) {
            return res.status(400).json({ error: 'Missing input', message: 'Please provide a description, select a theme, or add an image.' });
        }
        if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
            return res.status(400).json({ error: 'Missing platforms', message: 'Please select at least one social media platform.' });
        }
        if (imageUrl && !imageUrl.startsWith('data:image') && !imageUrl.startsWith('http')) {
            return res.status(400).json({ error: 'Invalid image URL', message: 'Image URL must be a data URI or HTTP(S) URL.' });
        }

        const creditsPerPostIdea = imageUrl ? 2 : 1; // Example: 2 credits if image, 1 if text-only
        const creditsNeeded = creditsPerPostIdea * count;
        
        if (userId) {
            const hasSufficientCredits = await hasEnoughCredits(userId, creditsNeeded);
            if (!hasSufficientCredits) {
                return res.status(402).json({ error: 'Insufficient credits', message: `You need ${creditsNeeded} credits for this request.` });
            }
        }

        const instructionForAI = customTheme || theme || "Analyze the provided image for a social media post.";
        const platformsText = platforms.join(', ');
        
        console.log("Instruction for AI:", instructionForAI);
        if (imageUrl) console.log("Image provided for analysis.");

        let systemPrompt = `You are a creative and insightful social media content specialist. 
        Your goal is to generate ${count} distinct and engaging social media post ideas.
        Each post idea must be tailored for ${platformsText}.
        
        You MUST return your response in the following JSON format:
        {
          "posts": [
            {
              "title": "Post Title 1",
              "content": "Post content including relevant hashtags.",
              "imagePrompt": "A concise description of the provided image if one was given, or a suggestion for a new image if no image was provided. If an image was provided, describe it accurately.",
              "bestTime": "Suggested day and time to post (e.g., 'Tuesday 9 AM')"
            } 
            // ... more posts up to 'count'
          ]
        }`;
        
        let userPromptText = `Generate ${count} social media post ideas based on the following instruction: "${instructionForAI}".`;
        if (productName) userPromptText += ` The post may concern the product: "${productName}".`;

        if (imageUrl) {
            systemPrompt += `\n\nAN IMAGE HAS BEEN PROVIDED. Your primary task is to analyze this image and base your post ideas (titles, content) on its visual content AND the user's text instructions. The "imagePrompt" field in your JSON response for each post should be an accurate and engaging description OF THE PROVIDED IMAGE.`;
            // Adjust userPromptText when image is present to clearly state the multimodal context
            userPromptText = `Based on the provided image and my instruction ("${instructionForAI}"), please generate ${count} social media posts.`;
            if (productName) userPromptText += ` The image might be related to the product: "${productName}".`;
        } else {
            systemPrompt += `\n\nNO IMAGE HAS BEEN PROVIDED. Base your post ideas solely on the text instructions. The "imagePrompt" field in your JSON response for each post should be a creative suggestion FOR AN IMAGE that would complement the post content.`;
        }

        const messages = [{ role: "system", content: systemPrompt }];
        if (imageUrl) {
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: userPromptText },
                    { type: "image_url", image_url: { url: imageUrl, detail: "high" } } // Use "high" for better analysis
                ]
            });
        } else {
            messages.push({ role: "user", content: userPromptText });
        }
        
        console.log("Calling OpenAI API (gpt-4o)...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
            response_format: { type: "json_object" }
        });
        
        const responseContent = response.choices[0].message.content;
        console.log("OpenAI response content (first 300 chars):", responseContent.substring(0,300));
        
        let postIdeas;
        try {
            const parsedResponse = JSON.parse(responseContent);
            if (parsedResponse.posts && Array.isArray(parsedResponse.posts)) {
                postIdeas = parsedResponse.posts.slice(0, count); 
                while (postIdeas.length < count && postIdeas.length > 0) { // Fill if not enough posts
                    const clone = { ...postIdeas[0], title: postIdeas[0].title + " (variation)" };
                    postIdeas.push(clone);
                }
            } else {
                throw new Error('Invalid response format from OpenAI: "posts" array missing or not an array.');
            }
            if (postIdeas.length === 0 && count > 0) {
                throw new Error('No posts returned from OpenAI, though posts were requested.');
            }
        } catch (err) {
            console.error('Error parsing OpenAI response:', err.message, "\nFull response:", responseContent);
            return res.status(500).json({ error: 'Failed to parse AI response', message: 'AI response issue. Please try again.' });
        }

        if (userId && postIdeas.length > 0) {
            const actualGeneratedCount = postIdeas.length;
            const finalCreditsToDeduct = creditsPerPostIdea * actualGeneratedCount; // Deduct based on actual posts provided
            await deductCredits(userId, finalCreditsToDeduct, 'social_post_generation_multimodal', {
                instruction: instructionForAI.substring(0, 100), // Log part of instruction
                generated_count: actualGeneratedCount,
                requested_count: count,
                has_image: !!imageUrl
            });
            console.log(`Deducted ${finalCreditsToDeduct} credits for user ${userId}.`);
        }

        // Optional: Save generated posts to database
        // if (userId && postIdeas.length > 0) { /* ... database saving logic ... */ }

        return res.status(200).json({ message: 'Successfully generated post ideas', posts: postIdeas });

    } catch (error) {
        console.error('Error in generatePostIdeas:', error);
        if (error.response && error.response.data && error.response.data.error) { 
            return res.status(500).json({ error: 'OpenAI API Error', message: error.response.data.error.message || 'Failed to process with AI.' });
        }
        return res.status(500).json({ error: 'Failed to generate post ideas', message: error.message || "Unknown error." });
    }
};

// Schedule a social media post
exports.schedulePost = async (req, res) => {
    console.log("Scheduling post:", JSON.stringify(req.body));
    try {
        const { 
            title, content, imagePrompt, 
            scheduledDate, scheduledTime, platforms,
            imageUrl, storagePath, // these are from SocialPostForm for the image attached to the post
            postType, theme, // Added from SocialPostForm for better context
        } = req.body;
        const userId = req.user.id;

        if (!content || !scheduledDate || !scheduledTime || !platforms || platforms.length === 0) {
            return res.status(400).json({ error: 'Missing required fields', message: 'Content, schedule, and platforms are required.' });
        }
        
        const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
        if (new Date(scheduledDateTime).getTime() <= new Date().getTime()) {
            return res.status(400).json({ error: 'Invalid scheduling time', message: 'Scheduled time must be in the future.' });
        }

        const { data, error } = await supabase.from('scheduled_posts').insert({
            user_id: userId,
            title: title || "Scheduled Post", // Default title
            content: content,
            image_prompt: imagePrompt,      // Prompt for image generation if imageUrl is not provided or for reference
            image_url: imageUrl,            // URL of the image associated with the post
            image_storage_path: storagePath,// Path in Supabase storage if applicable
            scheduled_at: scheduledDateTime,
            platforms: platforms,
            status: 'scheduled',
            post_type: postType, // Store post type
            theme: theme,        // Store theme
            created_at: new Date().toISOString()
        }).select().single(); // Use single() if you expect one row back

        if (error) {
            console.error("Error scheduling post in DB:", error);
            throw error;
        }
        console.log("Post scheduled successfully in DB:", data);
        return res.status(200).json({ message: 'Post scheduled successfully', scheduledPost: data });
    } catch (error) {
        console.error('Error in schedulePost controller:', error);
        return res.status(500).json({ error: 'Failed to schedule post', message: error.message });
    }
};

// Get user's scheduled posts
exports.getScheduledPosts = async (req, res) => {
    console.log("getScheduledPosts called for user:", req.user?.id);
    try {
        const userId = req.user.id;
        const { data: postsFromDb, error } = await supabase
            .from('scheduled_posts')
            .select('*')
            .eq('user_id', userId)
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error("Error fetching scheduled posts from DB:", error);
            throw error;
        }

        if (!postsFromDb) {
            return res.status(200).json({ message: 'No scheduled posts found', scheduledPosts: [] });
        }
        
        console.log(`Fetched ${postsFromDb.length} posts from DB. Generating signed URLs...`);

        const postsWithSignedUrls = await Promise.all(
            postsFromDb.map(async (post) => {
                let displayImageUrl = post.image_url; // Use existing image_url by default (if it's already public or from external source)
                
                // If image_storage_path exists, it means it's in our Supabase bucket & we should generate a signed URL
                if (post.image_storage_path) { 
                    try {
                        const { data: signedUrlData, error: signError } = await supabase.storage
                            .from(BUCKET_NAME)
                            .createSignedUrl(post.image_storage_path, 60 * 60); // URL valid for 1 hour

                        if (signError) {
                            console.error(`Error creating signed URL for ${post.image_storage_path}:`, signError.message);
                            // Keep the original post.image_url or set to null if signing fails
                        } else if (signedUrlData && signedUrlData.signedUrl) {
                            displayImageUrl = signedUrlData.signedUrl;
                            // console.log(`Generated signed URL for ${post.id}: ${displayImageUrl.substring(0,100)}...`);
                        }
                    } catch (e) {
                        console.error(`Exception creating signed URL for ${post.image_storage_path}:`, e.message);
                    }
                }
                return { ...post, image_url_for_display: displayImageUrl }; // Add a new field for the URL to be used in <img>
            })
        );
        
        console.log("Returning posts with signed URLs (or original image_url).");
        return res.status(200).json({ message: 'Scheduled posts retrieved successfully', scheduledPosts: postsWithSignedUrls });

    } catch (error) {
        console.error('Error in getScheduledPosts controller:', error);
        return res.status(500).json({ error: 'Failed to retrieve scheduled posts', message: error.message });
    }
};
// Delete a scheduled post
exports.deleteScheduledPost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Verify post belongs to user before deleting
        const { data: post, error: findError } = await supabase
            .from('scheduled_posts').select('id').eq('id', id).eq('user_id', userId).single();
        if (findError || !post) return res.status(404).json({ error: 'Post not found or not authorized' });

        const { error } = await supabase.from('scheduled_posts').delete().eq('id', id);
        if (error) throw error;
        return res.status(200).json({ message: 'Scheduled post deleted successfully' });
    } catch (error) {
        console.error('Error deleting scheduled post:', error);
        return res.status(500).json({ error: 'Failed to delete post', message: error.message });
    }
};


module.exports = exports;