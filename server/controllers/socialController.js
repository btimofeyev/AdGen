// server/controllers/socialController.js
const { OpenAI } = require('openai');
const supabase = require('../lib/supabase');
const { hasEnoughCredits, deductCredits } = require('../utils/creditUtils');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BUCKET_NAME = 'scenesnapai'; // Ensure this matches your Supabase bucket name

const logRequest = (routeName, body, userId) => {
  const logBody = { ...body };
  if (logBody.imageUrl) logBody.imageUrl = `${logBody.imageUrl.substring(0, 50)}... (truncated)`;
  console.log(`--- ${routeName} --- User: ${userId} --- Body: ${JSON.stringify(logBody)} ---`);
};

const handleError = (res, error, defaultMessage, statusCode = 500) => {
  console.error(`Error: ${error.message}`, error.stack ? `\nStack: ${error.stack}` : '');
  if (error.response && error.response.data && error.response.data.error) {
    return res.status(statusCode).json({ error: 'OpenAI API Error', message: error.response.data.error.message || defaultMessage });
  }
  return res.status(statusCode).json({ error: defaultMessage, message: error.message || "Unknown server error." });
};

const buildOpenAIPrompt = (customTheme, theme, productName, count, platformsText, imageUrl) => {
  const instructionForAI = customTheme || theme || "Analyze the provided image for a social media post.";
  
  let systemPrompt = `You are a creative social media content specialist. Generate ${count} distinct, engaging post ideas for ${platformsText}.
    Return a JSON object: {"posts": [{"title": "Post Title", "content": "Post content with hashtags.", "imagePrompt": "Description of provided image or suggestion for new one.", "bestTime": "Suggested post time (e.g., 'Tuesday 9 AM')"}]}`;
  
  let userPromptText = `Generate ${count} social media post ideas based on: "${instructionForAI}".`;
  if (productName) userPromptText += ` Product: "${productName}".`;

  if (imageUrl) {
    systemPrompt += `\n\nIMAGE PROVIDED. Base ideas on image and text. "imagePrompt" should describe THE PROVIDED IMAGE.`;
    userPromptText = `Based on the provided image and instruction ("${instructionForAI}"), generate ${count} posts.`;
    if (productName) userPromptText += ` Image may relate to product: "${productName}".`;
  } else {
    systemPrompt += `\n\nNO IMAGE PROVIDED. Base ideas on text. "imagePrompt" should be a creative IMAGE SUGGESTION.`;
  }
  return { systemPrompt, userPromptText, instructionForAI };
};

exports.generatePostIdeas = async (req, res) => {
  const userId = req.user?.id;
  logRequest('generatePostIdeas', req.body, userId);
    
  try {
    const { theme, customTheme, platforms, count = 3, productName, imageUrl } = req.body;

    if (!customTheme && !theme && !imageUrl) return res.status(400).json({ message: 'Description, theme, or image required.' });
    if (!platforms?.length) return res.status(400).json({ message: 'At least one platform required.' });
    if (imageUrl && !imageUrl.startsWith('data:image') && !imageUrl.startsWith('http')) return res.status(400).json({ message: 'Image URL must be data URI or HTTP(S).' });

    const creditsPerPostIdea = imageUrl ? 2 : 1;
    const creditsNeeded = creditsPerPostIdea * count;
        
    if (userId) {
      if (!(await hasEnoughCredits(userId, creditsNeeded))) {
        return res.status(402).json({ message: `Insufficient credits. Need ${creditsNeeded}.` });
      }
    }

    const platformsText = platforms.join(', ');
    const { systemPrompt, userPromptText, instructionForAI } = buildOpenAIPrompt(customTheme, theme, productName, count, platformsText, imageUrl);

    const messages = [{ role: "system", content: systemPrompt }];
    if (imageUrl) {
      messages.push({ role: "user", content: [{ type: "text", text: userPromptText }, { type: "image_url", image_url: { url: imageUrl, detail: "high" } }] });
    } else {
      messages.push({ role: "user", content: userPromptText });
    }
        
    const openAIResponse = await openai.chat.completions.create({ model: "gpt-4o", messages, response_format: { type: "json_object" } });
    const responseContent = openAIResponse.choices[0].message.content;
        
    let postIdeas;
    try {
      const parsedResponse = JSON.parse(responseContent);
      if (!parsedResponse.posts?.length && count > 0) throw new Error('No posts returned from OpenAI.');
      postIdeas = parsedResponse.posts.slice(0, count);
      while (postIdeas.length < count && postIdeas.length > 0) { // Fill if OpenAI returns fewer than requested
        postIdeas.push({ ...postIdeas[0], title: `${postIdeas[0].title} (variation)` });
      }
    } catch (err) {
      console.error('Error parsing OpenAI response:', err.message, "\nFull OpenAI response:", responseContent);
      return res.status(500).json({ message: 'AI response issue. Please try again.' });
    }

    if (userId && postIdeas.length > 0) {
      const finalCreditsToDeduct = creditsPerPostIdea * postIdeas.length;
      await deductCredits(userId, finalCreditsToDeduct, 'social_post_generation_multimodal', {
          instruction: instructionForAI.substring(0, 100), generated_count: postIdeas.length,
          requested_count: count, has_image: !!imageUrl
      });
    }
    return res.status(200).json({ posts: postIdeas });
  } catch (error) {
    return handleError(res, error, 'Failed to generate post ideas');
  }
};

exports.schedulePost = async (req, res) => {
  const userId = req.user?.id;
  logRequest('schedulePost', req.body, userId);
  try {
    const { title, content, imagePrompt, scheduledDate, scheduledTime, platforms, imageUrl, storagePath, postType, theme } = req.body;

    if (!content || !scheduledDate || !scheduledTime || !platforms?.length) {
      return res.status(400).json({ message: 'Content, schedule, and platforms are required.' });
    }
    const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
    if (new Date(scheduledDateTime) <= new Date()) {
      return res.status(400).json({ message: 'Scheduled time must be in the future.' });
    }

    const { data, error } = await supabase.from('scheduled_posts').insert({
        user_id: userId, title: title || "Scheduled Post", content, image_prompt: imagePrompt,
        image_url: imageUrl, image_storage_path: storagePath, scheduled_at: scheduledDateTime,
        platforms, status: 'scheduled', post_type: postType, theme, created_at: new Date().toISOString()
    }).select().single();

    if (error) throw error;
    return res.status(200).json({ message: 'Post scheduled successfully', scheduledPost: data });
  } catch (error) {
    return handleError(res, error, 'Failed to schedule post');
  }
};

exports.getScheduledPosts = async (req, res) => {
  const userId = req.user?.id;
  logRequest('getScheduledPosts', {}, userId);
  try {
    const { data: postsFromDb, error } = await supabase
        .from('scheduled_posts').select('*').eq('user_id', userId).order('scheduled_at', { ascending: true });

    if (error) throw error;
    if (!postsFromDb) return res.status(200).json({ scheduledPosts: [] });
        
    const postsWithSignedUrls = await Promise.all(
      postsFromDb.map(async (post) => {
        let displayImageUrl = post.image_url; 
        if (post.image_storage_path) { 
          try {
            const { data: signedUrlData, error: signError } = await supabase.storage
                .from(BUCKET_NAME).createSignedUrl(post.image_storage_path, 3600); // 1 hour
            if (signError) console.error(`Error creating signed URL for ${post.image_storage_path}:`, signError.message);
            else if (signedUrlData?.signedUrl) displayImageUrl = signedUrlData.signedUrl;
          } catch (e) {
            console.error(`Exception creating signed URL for ${post.image_storage_path}:`, e.message);
          }
        }
        return { ...post, image_url_for_display: displayImageUrl };
      })
    );
    return res.status(200).json({ scheduledPosts: postsWithSignedUrls });
  } catch (error) {
    return handleError(res, error, 'Failed to retrieve scheduled posts');
  }
};

exports.deleteScheduledPost = async (req, res) => {
  const userId = req.user?.id;
  logRequest('deleteScheduledPost', req.params, userId);
  try {
    const { id } = req.params;
    const { data: post, error: findError } = await supabase
        .from('scheduled_posts').select('id').eq('id', id).eq('user_id', userId).single();
    
    if (findError || !post) return res.status(404).json({ message: 'Post not found or not authorized' });

    const { error } = await supabase.from('scheduled_posts').delete().eq('id', id);
    if (error) throw error;
    return res.status(200).json({ message: 'Scheduled post deleted successfully' });
  } catch (error) {
    return handleError(res, error, 'Failed to delete post');
  }
};
