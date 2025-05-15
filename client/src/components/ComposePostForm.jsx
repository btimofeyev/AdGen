import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, UploadCloud, Image, Check } from "lucide-react";
import supabase from "../lib/supabase"; // The supabase JS client
import { useAuth } from "../contexts/AuthContext";

const platformsList = [
  { id: "instagram", name: "Instagram" },
  { id: "facebook", name: "Facebook" }
];

const BUCKET_NAME = "scenesnapai";

export default function ComposePostForm({ onPostScheduled }) {
  const { user } = useAuth();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [platforms, setPlatforms] = useState(["instagram"]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  // Image upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // AI Generator
  const [aiLoading, setAiLoading] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  async function handleImageChange(e) {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
    else setImagePreview(null);
  }

  // Supabase upload
  async function uploadImageToSupabase(file) {
    if (!user) throw new Error("Not authenticated.");
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^A-Za-z0-9.\-_]/g, "_");
    const storagePath = `${user.id}/social_images/${timestamp}_${safeName}`;
    // Upload
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file);
    if (error) throw error;
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);
    return { publicUrl: data.publicUrl, storagePath };
  }

  // Generate with AI (mock - wire up to your API as needed)
  const handleGenerateAI = async () => {
    setAiLoading(true);
    // EXAMPLE: fake result, replace with your API
    setTimeout(() => {
      setTitle("✨ AI Magic Summer Promotion");
      setContent("Enjoy 40% off all summer items while supplies last! #SummerSale #ShopNow");
      setImagePrompt("Bright, cheerful summer clothing on a beach background");
      setAiLoading(false);
    }, 1000);
  };

  async function handleSchedule(e) {
    e.preventDefault();
    setSubmitting(true);

    let imageUrl = null, imageStoragePath = null;
    try {
      // Upload to Supabase if file selected
      if (imageFile) {
        const res = await uploadImageToSupabase(imageFile);
        imageUrl = res.publicUrl;
        imageStoragePath = res.storagePath;
      }

      // Schedule post (call your backend)
      const session = await supabase.auth.getSession();
      const accessToken = session.data?.session?.access_token;

      const response = await fetch("/api/social/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title,
          content,
          imagePrompt,
          imageUrl,
          imageStoragePath,
          scheduledDate,
          scheduledTime,
          platforms,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to schedule post.");
      }

      // Optionally update parent UI
      if (onPostScheduled) {
        const result = await response.json();
        onPostScheduled(result.scheduledPost);
      }
      // Reset
      setTitle(""); setContent(""); setImagePrompt(""); setPlatforms(["instagram"]);
      setScheduledDate(""); setScheduledTime("");
      setImageFile(null); setImagePreview(null);

      alert("Post scheduled!");

    } catch (err) {
      alert(`Error: ${err.message}`);
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSchedule} className="bg-[#23262F] p-6 rounded-xl max-w-2xl mx-auto">
      <h2 className="font-bold text-2xl mb-4">Compose a New Post</h2>

      <input
        className="mb-2 w-full p-2 rounded bg-[#181A20] text-white"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <textarea
        className="mb-2 w-full p-2 rounded bg-[#181A20] text-white h-24"
        placeholder="Content"
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      {/* Image Upload */}
      <div className="mb-3">
        <label className="block text-white/70 mb-1 font-medium">Image (optional)</label>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded bg-pastel-blue text-[#181A20] hover:bg-pastel-blue/90 font-semibold">
            <UploadCloud size={16} />
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
          {imageFile && (
            <>
              <div className="flex items-center gap-2">
                <Image size={18} className="text-pastel-blue" />
                <span className="text-white text-sm">{imageFile.name}</span>
              </div>
              <button
                type="button"
                className="ml-2 text-xs bg-pastel-pink text-[#181A20] px-2 py-1 rounded hover:bg-pastel-pink/90"
                onClick={() => { setImageFile(null); setImagePreview(null); }}
              >
                Remove
              </button>
            </>
          )}
        </div>
        {imagePreview && (
          <div className="mt-2">
            <img src={imagePreview} alt="Preview" className="max-h-40 rounded" />
          </div>
        )}
      </div>

      {/* Optional image prompt */}
      <input
        className="mb-2 w-full p-2 rounded bg-[#181A20] text-white"
        placeholder="Image Prompt (optional)"
        value={imagePrompt}
        onChange={e => setImagePrompt(e.target.value)}
      />

      {/* Platforms */}
      <div className="flex gap-2 mb-4">
        {platformsList.map(p => (
          <label key={p.id} className="text-white/80">
            <input
              type="checkbox"
              checked={platforms.includes(p.id)}
              onChange={() =>
                setPlatforms(ps =>
                  ps.includes(p.id) ? ps.filter(x => x !== p.id) : [...ps, p.id]
                )
              }
            />
            <span className="ml-1">{p.name}</span>
          </label>
        ))}
      </div>

      {/* Divider + AI generator */}
      <div className="border-t border-gray-700 my-4 pt-2">
        <span className="block mb-2 text-sm text-gray-400">Or fill these fields with AI:</span>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerateAI}
          className="mb-4 px-4 py-2 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg flex items-center"
          disabled={aiLoading}
        >
          <Sparkles size={18} className="mr-2" />
          {aiLoading ? "Generating..." : "Generate with AI"}
        </motion.button>
      </div>

      {/* Scheduler */}
      <div className="flex gap-2 mb-2">
        <input
          className="p-2 rounded bg-[#181A20] text-white flex-1"
          type="date"
          value={scheduledDate}
          onChange={e => setScheduledDate(e.target.value)}
          required />
        <input
          className="p-2 rounded bg-[#181A20] text-white flex-1"
          type="time"
          value={scheduledTime}
          onChange={e => setScheduledTime(e.target.value)}
          required />
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        className="w-full py-3 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg font-medium mt-2"
        type="submit"
        disabled={submitting}
      >
        <Check size={18} className="mr-2 inline" /> {submitting ? "Scheduling..." : "Schedule Post"}
      </motion.button>
    </form>
  );
}