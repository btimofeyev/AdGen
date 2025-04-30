// Updated AdCreator.jsx with enhanced UI components
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileUp,
  X,
  ImagePlus,
  Home,
  User,
  Settings,
  LogOut,
  Zap,
  RefreshCw,
  Download,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../config";
import supabase from "../lib/supabase";
import ImageModal from "../components/ImageModal";
import ImageGrid from "../components/ImageGrid";
import UserCredits from "../components/UserCredits";

function AdCreator() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const [credits, setCredits] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [creditsError, setCreditsError] = useState(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadedFilePath, setUploadedFilePath] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [numImages, setNumImages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("create");
  const [paymentComplete, setPaymentComplete] = useState(false);

  // State for tracking if a generation request is in progress
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  
  // Caching refs to prevent unnecessary reloads
  const creditsLoadedRef = useRef(false);
  const imagesLoadedRef = useRef(false);

  const promptInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Focus on prompt input on component mount
  useEffect(() => {
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }

    // If no user, redirect to login
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Effect to load user's saved images and credits only once per session
  useEffect(() => {
    if (user) {
      if (!imagesLoadedRef.current) {
        loadUserImages();
        imagesLoadedRef.current = true;
      }
      if (!creditsLoadedRef.current) {
        loadUserCredits();
        loadUserSubscription();
        creditsLoadedRef.current = true;
      }
    }
    // Only run on initial mount or user change
  }, [user]);

  // Load user credits
  const loadUserCredits = async () => {
    try {
      setCreditsLoading(true);
      setCreditsError(null);
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setCreditsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/users/credits`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No credits found, this is okay for new users
          setCredits({
            available_credits: 0,
            total_credits_received: 0,
            credits_used: 0,
          });
        } else {
          const errorData = await response.json();
          setCreditsError(errorData.error || "Failed to load credits");
          throw new Error(errorData.error || "Failed to load credits");
        }
      } else {
        const data = await response.json();
        setCredits(data);
      }
    } catch (err) {
      setCreditsError(err.message);
      console.error("Error loading user credits:", err);
    } finally {
      setCreditsLoading(false);
    }
  };

  // Load user subscription
  const loadUserSubscription = async () => {
    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setSubscription(null);
        return;
      }
      const response = await fetch(`${API_URL}/users/subscription`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      setSubscription(null);
      console.error("Error loading user subscription:", err);
    }
  };

  // Function to load user's saved images
  const loadUserImages = async () => {
    try {
      setIsLoadingImages(true);
      setError(null); // Clear any previous errors

      // Get auth token for the request
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session found for image loading");
        setIsLoadingImages(false);
        return;
      }

      console.log(
        "Fetching user images with token:",
        session.access_token.substring(0, 10) + "..."
      );
      const response = await fetch(`${API_URL}/user/images`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      // Log the raw response for debugging
      console.log("Image fetch response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response text:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: "Unknown error" };
        }

        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // Debug output to see what we're getting from the server
      console.log("Received images data from server:", data);

      if (data.images && Array.isArray(data.images)) {
        console.log(`Loaded ${data.images.length} images from server`);

        // Add a unique id to each image if not present and ensure base64Image is properly formatted
        const processedImages = data.images.map((img, index) => {
          // Make sure we have an ID
          const imgId = img.id || `temp-${Date.now()}-${index}`;

          // Ensure base64Image has the correct prefix if it doesn't already
          let base64Image = img.base64Image;
          if (base64Image && !base64Image.startsWith("data:image/")) {
            base64Image = `data:image/png;base64,${base64Image}`;
          }

          return {
            ...img,
            id: imgId,
            base64Image: base64Image,
            // Add placeholder values for any missing required fields
            created_at: img.created_at || new Date().toISOString(),
            prompt: img.prompt || "Generated image",
          };
        });

        setGeneratedImages(processedImages);
      } else {
        console.log("No images found or invalid response format");
        // Don't reset images if there's no data - might be a server issue
        // Only set empty if explicitly empty from server
        if (data.images && data.images.length === 0) {
          setGeneratedImages([]);
        }
      }
    } catch (err) {
      console.error("Error loading user images:", err);
      setError(`Failed to load your gallery: ${err.message}`);
      // Don't reset images array on error - keep old ones visible
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Reset states
    setError(null);
    setFile(selectedFile);
    setUploadedFilePath(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  // Upload the image to the server
  const uploadImage = async () => {
    if (!file) return null;

    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: session ? `Bearer ${session.access_token}` : "",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      return data.filepath;
    } catch (err) {
      setError(`Upload error: ${err.message}`);
      return null;
    }
  };

  // Generate images based on the uploaded image and prompt
  const generateImages = async (filePath) => {
    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Generate a unique ID for this request
      const requestId = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      const requestBody = {
        filepath: filePath,
        prompt: prompt,
        count: numImages,
        requestId, // Include request ID for server-side tracking
      };

      console.log(
        `Sending image generation request: ${requestId} for ${numImages} images`
      );

      const response = await fetch(`${API_URL}/generate/multiple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session ? `Bearer ${session.access_token}` : "",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          throw new Error(
            `Insufficient credits: ${
              errorData.message ||
              "You need more credits to generate these images."
            }`
          );
        }
        throw new Error(errorData.error || "Failed to generate images");
      }

      const data = await response.json();
      return data.results;
    } catch (err) {
      setError(`Generation error: ${err.message}`);
      return [];
    }
  };

  // Generate images from scratch (without reference image)
  const generateImagesFromScratch = async () => {
    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Generate a unique ID for this request
      const requestId = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      const requestBody = {
        prompt: prompt,
        count: numImages,
        requestId, // Include request ID for server-side tracking
      };

      console.log(
        `Sending image generation from scratch request: ${requestId} for ${numImages} images`
      );

      const response = await fetch(`${API_URL}/generate/multiple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session ? `Bearer ${session.access_token}` : "",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          throw new Error(
            `Insufficient credits: ${
              errorData.message ||
              "You need more credits to generate these images."
            }`
          );
        }
        throw new Error(errorData.error || "Failed to generate images");
      }

      const data = await response.json();
      return data.results;
    } catch (err) {
      setError(`Generation error: ${err.message}`);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (loading || isSubmitting) {
      console.log(
        "Generation already in progress, ignoring duplicate submission"
      );
      return;
    }

    // Add debounce to prevent accidental double clicks (300ms)
    const now = Date.now();
    if (now - lastRequestTime < 300) {
      console.log("Request throttled, please wait");
      return;
    }
    setLastRequestTime(now);

    if (!prompt.trim()) return;

    // Check if user has enough credits first
    if (credits && numImages > credits.available_credits) {
      setError(
        `You don't have enough credits. You have ${credits.available_credits} credits but need ${numImages} to generate these images.`
      );
      return;
    }

    // Generate a request ID on the client side
    const requestId = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    console.log(
      `Starting generation request: ${requestId} for ${numImages} images`
    );

    setLoading(true);
    setIsSubmitting(true);
    setError(null);

    try {
      let results = [];

      if (file) {
        // For subsequent requests, always re-upload to ensure server has the file
        let filePath = null;

        // If we're quickly generating images again, always upload a fresh copy
        // This ensures we don't run into file cleanup issues on the server
        if (now - lastRequestTime < 30000) {
          // If within 30 seconds of last request
          console.log(
            "Recent request detected - uploading fresh copy of image"
          );
          filePath = await uploadImage();
        } else {
          // Try to use existing path first, but fall back to re-uploading
          filePath = uploadedFilePath || (await uploadImage());
        }

        if (!filePath) throw new Error("Failed to upload image");

        // Save the file path for future generations
        setUploadedFilePath(filePath);

        // Generate images with the uploaded image as reference
        results = await generateImages(filePath);
      } else {
        // Generate images from scratch based only on the prompt
        results = await generateImagesFromScratch();
      }

      if (results.length === 0) {
        throw new Error("No images were generated");
      }

      // Format the results with additional metadata - no explicit labels
      const formattedResults = results.map((result, index) => ({
        ...result,
        id: result.id || Date.now() + index, // Use server-provided ID or generate one
        timestamp: new Date().toISOString(),
      }));

      // Add new images to existing ones
      setGeneratedImages((prev) => [...formattedResults, ...prev]);

      // Refresh credits after generation
      handleRefreshCredits();

      // Switch to gallery tab
      setActiveTab("gallery");
    } catch (err) {
      setError(err.message);
      console.error("Error in generation process:", err);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // Handle image download
  const handleDownload = (base64Image, index) => {
    const link = document.createElement("a");
    link.href = base64Image;
    link.download = `generated-ad-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy image to clipboard
  const handleCopyImage = async (imageBase64, index) => {
    try {
      // Convert the base64 string to a blob
      const fetchResponse = await fetch(imageBase64);
      const blob = await fetchResponse.blob();

      // Create a ClipboardItem and write to clipboard
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);

      // You could add a toast notification here to confirm copy
      alert("Image copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy image: ", err);
      // Fallback for browsers that don't support clipboard API
      handleDownload(imageBase64, index);
    }
  };

  // Handle opening the modal with a specific image
  const handleOpenModal = (image) => {
    setSelectedImage(image);
    setModalOpen(true);
  };

  // Handle image deletion
  const handleDeleteImage = async (imageId) => {
    try {
      console.log("Attempting to delete image with ID:", imageId);

      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be logged in to delete images");
        return;
      }

      // Log the request details
      console.log(
        "Sending delete request to:",
        `${API_URL}/user/images/${imageId}`
      );
      console.log(
        "Using auth token:",
        session.access_token.substring(0, 10) + "..."
      );

      const response = await fetch(`${API_URL}/user/images/${imageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log("Delete response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response text:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: "Unknown error" };
        }

        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Response was successful
      console.log("Image deleted successfully");

      // Remove the image from the state
      setGeneratedImages((prev) => prev.filter((img) => img.id !== imageId));

      // Close modal if the deleted image was being displayed
      if (selectedImage && selectedImage.id === imageId) {
        setModalOpen(false);
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      setError(`Delete error: ${err.message}`);
    }
  };

  // Handle downloading all images
  const handleDownloadAll = () => {
    // This would normally use a zip library like JSZip to download all images
    // For now, just alert the user
    alert("Download all functionality would go here");
  };

  const funPrompts = [
    "Place my product in a cozy living room",
    "Put my product on a marble desk",
    "Feature my product with a beach background",
    "Show my product on a luxury shelf",
    "Style my product in an outdoor market",
  ];

  const handleFunPromptClick = (text) => {
    setPrompt(text);
    promptInputRef.current.focus();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Handle tab switching without reloading content
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Explicit refresh handlers
  const handleRefreshCredits = () => {
    setCreditsLoading(true);
    loadUserCredits();
    creditsLoadedRef.current = true;
  };
  const handleRefreshImages = () => {
    setIsLoadingImages(true);
    loadUserImages();
    imagesLoadedRef.current = true;
  };

  // Memoize the sidebar content to prevent re-rendering
  const SidebarContent = useMemo(() => (
    <div className="w-80 p-6 bg-[#23262F] border-l border-[#23262F]/60 overflow-y-auto">
      {/* Credit Usage */}
      <div className="mb-8">
        <UserCredits 
          credits={credits}
          creditsLoading={creditsLoading}
          subscription={subscription}
          onRefresh={handleRefreshCredits}
          error={creditsError}
        />
      </div>

      {/* Upload Thumbnail */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">Your Product</h2>
        {preview ? (
          <motion.div
            className="relative rounded-xl overflow-hidden shadow-sm border border-[#23262F]/60 group"
            whileHover={{
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <img
              src={preview}
              alt="Uploaded"
              className="object-contain w-full h-40"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setPreview(null);
                setFile(null);
                setUploadedFilePath(null);
              }}
              className="absolute top-2 right-2 bg-[#23262F] p-1.5 rounded-full shadow-md opacity-80 hover:opacity-100"
            >
              <X size={16} className="text-pastel-blue" />
            </motion.button>

            {/* Darkened overlay with prompt on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
              <p className="text-white text-sm text-center font-medium">
                {file?.name || "Your uploaded product image"}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{
              scale: 1.02,
              backgroundColor: "rgba(123, 223, 242, 0.05)",
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-pastel-blue/30 p-8 rounded-xl hover:bg-pastel-blue/10 transition-all"
            onClick={() => fileInputRef.current.click()}
          >
            <div className="p-3 bg-pastel-blue/10 rounded-full">
              <ImagePlus size={28} className="text-pastel-blue" />
            </div>
            <div className="text-center">
              <span className="text-sm font-semibold text-pastel-blue block mb-1">
                Upload Image
              </span>
              <span className="text-xs text-charcoal/50">
                PNG, JPG or WEBP (max 10MB)
              </span>
            </div>
          </motion.button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png,image/jpeg,image/jpg,image/webp"
        />
      </div>

      {/* Fun Prompts */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">Scene Ideas</h2>
        <div className="space-y-2">
          {funPrompts.map((text, idx) => (
            <motion.button
              key={idx}
              whileHover={{
                scale: 1.02,
                backgroundColor: "rgba(123, 223, 242, 0.15)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleFunPromptClick(text)}
              className="w-full text-left text-sm text-pastel-blue bg-pastel-blue/10 hover:bg-pastel-blue/20 p-3 rounded-lg font-medium transition-all"
            >
              {text}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Number of Images Selector */}
      <div>
        <h2 className="text-lg font-bold mb-3">How Many Visuals?</h2>

        {/* Credit Status Indicator */}
        {!creditsLoading && credits && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              credits.available_credits < numImages
                ? "bg-gradient-to-r from-pastel-pink/20 to-pastel-pink/5 text-pastel-pink border border-pastel-pink/20"
                : credits.available_credits < 5
                ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200/30"
                : "bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200/30"
            }`}
          >
            <div className="flex items-center">
              <Zap size={14} className="mr-2 flex-shrink-0" />
              <span className="font-medium">
                {credits.available_credits < numImages
                  ? `Need ${
                      numImages - credits.available_credits
                    } more credit${
                      numImages - credits.available_credits !== 1
                        ? "s"
                        : ""
                    }`
                  : `${credits.available_credits} credit${
                      credits.available_credits !== 1 ? "s" : ""
                    } available`}
              </span>
            </div>
            {credits.available_credits < numImages && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/account"
                  className="mt-2 block text-center w-full px-3 py-1.5 bg-background dark:bg-pastel-blue text-foreground dark:text-[#181A20] rounded-md text-xs font-medium shadow-sm hover:shadow transition-all"
                >
                  Get More Credits
                </Link>
              </motion.div>
            )}
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((num) => (
            <motion.button
              key={num}
              whileHover={{ scale: numImages !== num ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setNumImages(num)}
              className={`rounded-lg py-3 font-semibold transition-all ${
                numImages === num
                  ? "bg-pastel-blue text-charcoal shadow-md"
                  : "bg-background text-foreground hover:bg-pastel-blue/80 dark:hover:bg-pastel-blue/60 hover:text-[#181A20] dark:hover:text-[#181A20] border border-border"
              }`}
            >
              {num}
            </motion.button>
          ))}
        </div>

        {/* Credit cost explanation */}
        <p className="text-xs text-charcoal/60 mt-3 text-center">
          Each image costs 1 credit
        </p>
      </div>
    </div>
  ), [preview, file, credits, creditsLoading, numImages, funPrompts, subscription, creditsError]);

  return (
    <div className="min-h-screen flex bg-[#181A20] text-gray-100">
      {/* Sidebar */}
      <div className="w-16 bg-[#23262F] shadow flex flex-col items-center py-6 space-y-6 border-r border-[#23262F]/60">
        <div className="flex items-center justify-center rounded-full bg-pastel-blue/20 p-2">
          <ImagePlus size={20} className="text-pastel-blue" />
        </div>
        <SidebarIcon
          icon={<User size={20} />}
          onClick={() => navigate("/account")}
        />
        <SidebarIcon icon={<Home size={20} />} onClick={() => navigate("/")} />
        <div className="mt-auto">
          <SidebarIcon icon={<LogOut size={20} />} onClick={handleLogout} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#181A20]">
        {/* Header */}
        <header className="bg-[#23262F] px-6 py-4 shadow flex items-center justify-between border-b border-[#23262F]/60">
          <div className="flex items-center">
            <h1 className="text-2xl font-extrabold text-white">
              <span className="text-pastel-blue">SnapSceneAI</span> Studio
            </h1>

            {/* Credits Quick View */}
            {!creditsLoading && credits && (
              <Link
                to="/account"
                className="ml-6 flex items-center text-sm bg-pastel-blue/10 hover:bg-pastel-blue/20 px-3 py-1 rounded-full transition text-pastel-blue border border-pastel-blue/30"
              >
                <Zap size={14} className="text-pastel-blue mr-1" />
                <span className="font-medium">{credits.available_credits}</span>
                <span className="text-pastel-blue/80 ml-1">credits</span>
              </Link>
            )}
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-[#23262F] rounded-lg p-1">
            <motion.button
              onClick={() => handleTabChange("create")}
              whileHover={{ scale: activeTab !== "create" ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "create"
                  ? "bg-[#181A20] shadow-sm text-white"
                  : "text-gray-300 hover:text-white hover:bg-[#23262F]/80"
              }`}
            >
              Create
            </motion.button>
            <motion.button
              onClick={() => handleTabChange("gallery")}
              whileHover={{ scale: activeTab !== "gallery" ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "gallery"
                  ? "bg-[#181A20] shadow-sm text-white"
                  : "text-gray-300 hover:text-white hover:bg-[#23262F]/80"
              }`}
            >
              Gallery{" "}
              {generatedImages.length > 0 && `(${generatedImages.length})`}
            </motion.button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Center Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl mx-auto mt-6 mx-6 bg-pastel-pink/20 border border-pastel-pink/50 rounded-lg p-4 text-red-400"
              >
                <p className="font-medium">Error: {error}</p>
                {error.includes("Failed to load your gallery") && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRefreshImages}
                    className="mt-2 text-sm bg-pastel-pink/10 hover:bg-pastel-pink/20 px-3 py-1 rounded-md text-pastel-pink transition-colors"
                  >
                    <RefreshCw className="h-3 w-3 mr-1 inline-block" /> Try
                    Again
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Content Area with Fixed Height */}
            <div className="flex-1 p-6 overflow-hidden">
              {/* Create Tab */}
              {activeTab === "create" && (
                <div className="w-full max-w-5xl mx-auto">
                  {/* Loading State */}
                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
                      {Array.from({ length: numImages }).map((_, idx) => (
                        <div
                          key={idx}
                          className="aspect-square bg-[#23262F] rounded-xl animate-pulse shadow-sm border border-[#23262F]/60 overflow-hidden"
                        >
                          <div className="w-full h-full bg-gradient-to-br from-[#23262F]/40 to-[#181A20]" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-20 bg-[#23262F] rounded-xl border border-[#23262F]/60 shadow-sm"
                    >
                      <motion.div
                        className="inline-flex items-center justify-center p-6 bg-pastel-blue/20 rounded-full mb-6"
                        whileHover={{ scale: 1.05 }}
                      >
                        <ImagePlus size={36} className="text-pastel-blue" />
                      </motion.div>
                      <h3 className="text-2xl font-semibold mb-3 text-white">
                        Create Your Scene
                      </h3>
                      <p className="text-gray-300 max-w-md mx-auto mb-8">
                        Upload your product image, choose a scene style, and let
                        SnapSceneAI transform it.
                      </p>
                      {!preview && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] px-8 py-4 rounded-full font-semibold shadow-md transition-all"
                          onClick={() => fileInputRef.current.click()}
                        >
                          <FileUp className="h-5 w-5 mr-2 inline-block" />
                          Upload Image
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Gallery Tab */}
              {activeTab === "gallery" && (
                <div className="w-full max-w-6xl mx-auto flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Your Generated Visuals
                      </h2>
                      <p className="text-gray-300 text-sm mt-1">
                        {generatedImages.length > 0
                          ? `${generatedImages.length} image${
                              generatedImages.length !== 1 ? "s" : ""
                            } • All images expire after 7 days`
                          : "Create your first visual to see it here"}
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      {!isLoadingImages && generatedImages.length > 0 && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleDownloadAll}
                            className="flex items-center gap-1.5 py-2 px-4 bg-[#23262F] border border-[#23262F]/60 hover:border-pastel-blue/40 text-gray-200 hover:text-white rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all"
                          >
                            <Download size={14} />
                            <span>Download All</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleRefreshImages}
                            className="flex items-center gap-1.5 py-2 px-4 bg-pastel-blue text-[#181A20] rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all hover:bg-pastel-blue/90"
                          >
                            <RefreshCw size={14} className="mr-1" />
                            <span>Refresh</span>
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>

                  {isLoadingImages ? (
                    // Skeleton loading state
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <div
                          key={`skeleton-${idx}`}
                          className="rounded-xl bg-[#23262F] border border-[#23262F]/60 shadow-sm overflow-hidden"
                        >
                          <div className="aspect-square bg-gradient-to-r from-[#181A20] to-[#23262F]/40 animate-pulse" />
                          <div className="p-4">
                            <div className="h-4 bg-[#23262F]/60 rounded animate-pulse mb-2 w-2/3" />
                            <div className="h-3 bg-[#23262F]/40 rounded animate-pulse w-1/3" />
                          </div>
                          <div className="px-4 pb-4 flex justify-between">
                            <div className="flex space-x-1">
                              <div className="w-8 h-8 rounded-md bg-[#23262F]/40 animate-pulse" />
                              <div className="w-8 h-8 rounded-md bg-[#23262F]/40 animate-pulse" />
                            </div>
                            <div className="w-8 h-8 rounded-md bg-[#23262F]/40 animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : generatedImages.length > 0 ? (
                    <div className="bg-[#23262F] p-6 rounded-2xl border border-[#23262F]/60 shadow-sm flex-grow overflow-y-auto">
                      <ImageGrid
                        images={generatedImages}
                        onDownload={handleDownload}
                        onCopy={handleCopyImage}
                        onModalOpen={handleOpenModal}
                        onDelete={handleDeleteImage}
                      />
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#23262F] rounded-xl border border-[#23262F]/60 shadow-sm p-8 text-center"
                    >
                      <div className="w-16 h-16 bg-[#181A20] rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImagePlus
                          size={24}
                          className="text-pastel-blue opacity-60"
                        />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-white">
                        No images yet
                      </h3>
                      <p className="text-gray-300 mb-6 max-w-md mx-auto">
                        Start by generating your first image. Upload a product
                        photo and describe the scene you want to create.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setActiveTab("create")}
                        className="px-6 py-3 bg-pastel-blue hover:bg-pastel-blue/90 text-[#181A20] font-medium rounded-lg shadow-sm transition-all"
                      >
                        Create Your First Image
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          {SidebarContent}
        </div>

        {/* Prompt Input - Fixed at Bottom */}
        <form
          onSubmit={handleSubmit}
          className="bg-background border-t border-border p-6 sticky bottom-0 z-10 shadow-md"
        >
          <div className="max-w-3xl mx-auto flex items-stretch gap-4">
            <div className="flex-1 relative">
              <textarea
                ref={promptInputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows="2"
                placeholder="Describe your scene... (e.g. 'Product on a beach at sunset')"
                className="w-full p-4 bg-background border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-pastel-blue focus:border-transparent shadow-sm hover:shadow transition-all text-foreground"
              />
              <div className="absolute right-3 bottom-3 text-xs text-charcoal/40">
                {prompt.length} / 300
              </div>
            </div>
            <motion.button
              whileHover={{ scale: !prompt.trim() || loading ? 1 : 1.03 }}
              whileTap={{ scale: !prompt.trim() || loading ? 1 : 0.97 }}
              type="submit"
              disabled={!prompt.trim() || loading}
              className={`px-8 py-4 rounded-xl font-bold shadow-md transition-all ${
                !prompt.trim() || loading
                  ? "bg-pastel-blue/30 text-pastel-blue/80 cursor-not-allowed"
                  : "bg-pastel-blue hover:bg-pastel-blue/80 dark:hover:bg-pastel-blue/60 text-charcoal dark:text-[#181A20] hover:text-[#181A20] dark:hover:text-[#181A20]"
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-charcoal"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </div>
              ) : (
                "Generate"
              )}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Modal */}
      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        image={selectedImage}
        onDownload={handleDownload}
        onCopy={handleCopyImage}
        onDelete={handleDeleteImage}
      />
    </div>
  );
}

function SidebarIcon({ icon, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, backgroundColor: "rgba(123, 223, 242, 0.1)" }}
      whileTap={{ scale: 0.9 }}
      className="text-charcoal/70 hover:text-pastel-blue hover:bg-pastel-blue/10 p-3 rounded-xl transition-all"
      onClick={onClick}
    >
      {icon}
    </motion.button>
  );
}

export default AdCreator;
