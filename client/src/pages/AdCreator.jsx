import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileUp, X, ImagePlus, Home, User, LogOut, Zap, RefreshCw, Download, Copy, Plus, Trash2, Check, Menu, SlidersHorizontal, Image,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../config";
import supabase from "../lib/supabase";
import ImageModal from "../components/ImageModal";
import ImageGrid from "../components/ImageGrid";
import UserCredits from "../components/UserCredits"; 
import CategorizedPrompts from '../components/CategorizedPrompts';
import JSZip from "jszip";
import { saveAs } from "file-saver";

const SidebarIcon = React.memo(({ icon, onClick, "aria-label": ariaLabel }) => (
  <motion.button
    whileHover={{ scale: 1.1, backgroundColor: "rgba(123, 223, 242, 0.1)" }}
    whileTap={{ scale: 0.9 }}
    className="text-charcoal/70 hover:text-pastel-blue hover:bg-pastel-blue/10 p-3 rounded-xl transition-all"
    onClick={onClick}
    aria-label={ariaLabel}
  >
    {icon}
  </motion.button>
));

function AdCreator() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  // CORRECTED: State for credits and subscription
  const [creditsState, setCreditsState] = useState({ 
    credits: null, 
    creditsLoading: true, 
    creditsError: null, 
    subscription: null 
  });
  
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  
  const [prompt, setPrompt] = useState("");
  const [numImages, setNumImages] = useState(1);
  const [imageSize, setImageSize] = useState("1024x1024");
  const [generationLoading, setGenerationLoading] = useState(false); // Specific for generation process
  const [pageError, setPageError] = useState(null); // General page/generation errors
  
  // CORRECTED: State for user's generated images
  const [userGeneratedImages, setUserGeneratedImages] = useState([]);
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(true);
  // const [userImagesError, setUserImagesError] = useState(null); // If specific error for gallery loading is needed

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState("create");
  
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const dataLoadedRef = useRef({ credits: false, images: false });

  const promptInputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [selectedUiImages, setSelectedUiImages] = useState({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showStylePopover, setShowStylePopover] = useState(false);
  const [showNumPopover, setShowNumPopover] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
    else if (promptInputRef.current) promptInputRef.current.focus();
  }, [user, navigate]);
  
  const fetchApiData = useCallback(async (endpoint, options = {}) => {
    if (!user) throw new Error("User not authenticated");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ message: "Server error" }));
      throw new Error(errData.message || errData.error || `HTTP error ${response.status}`);
    }
    return response.json();
  }, [user]);

  const loadUserCreditsAndSubscription = useCallback(async () => {
    setCreditsState(prev => ({ ...prev, creditsLoading: true, creditsError: null }));
    try {
      const creditsData = await fetchApiData('/users/credits');
      const subscriptionData = await fetchApiData('/users/subscription');
      setCreditsState({ 
        credits: creditsData, 
        subscription: subscriptionData?.subscription, 
        creditsLoading: false, 
        creditsError: null 
      });
    } catch (err) {
      console.error("Error loading credits/subscription:", err);
      setCreditsState(prev => ({ ...prev, creditsLoading: false, creditsError: err.message, credits: prev.credits || null, subscription: prev.subscription || null }));
    }
  }, [fetchApiData]);

  const loadUserGeneratedImages = useCallback(async () => {
    setIsLoadingUserImages(true);
    // setUserImagesError(null); // If using a specific error state for gallery
    try {
      const imageData = await fetchApiData('/user/images');
      const processedImages = (imageData?.images || []).map((img, index) => {
          let base64Image = img.base64Image;
          if (base64Image && !base64Image.startsWith("data:image/")) {
            base64Image = `data:image/png;base64,${base64Image}`;
          }
          return { ...img, id: img.id || `temp-${Date.now()}-${index}`, base64Image, created_at: img.created_at || new Date().toISOString(), prompt: img.prompt || "Generated" };
      });
      setUserGeneratedImages(processedImages);
    } catch (err) {
      console.error("Error loading user images:", err);
      setPageError(`Gallery load failed: ${err.message}`); // Use general page error or specific gallery error
      // setUserImagesError(err.message);
    } finally {
      setIsLoadingUserImages(false);
    }
  }, [fetchApiData]);

  useEffect(() => {
    if (user) {
      if (!dataLoadedRef.current.images) { loadUserGeneratedImages(); dataLoadedRef.current.images = true; }
      if (!dataLoadedRef.current.credits) { loadUserCreditsAndSubscription(); dataLoadedRef.current.credits = true; }
    }
  }, [user, loadUserGeneratedImages, loadUserCreditsAndSubscription]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).slice(0, 4);
    if (e.target.files.length > 4) alert("Max 4 images. First 4 processed.");
    setFiles(selectedFiles);
    const newPreviews = [];
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        newPreviews.push(ev.target.result);
        if (newPreviews.length === selectedFiles.length) setPreviews(newPreviews);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAllImages = async () => {
    if (files.length === 0) return [];
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required for upload.");
    
    const uploadedPaths = await Promise.all(files.map(async (file) => {
        const formData = new FormData(); formData.append("image", file);
        const response = await fetch(`${API_URL}/upload`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body: formData });
        if (!response.ok) { const d = await response.json().catch(()=>{}); throw new Error(d.error || "Upload failed"); }
        return (await response.json()).filepath;
    }));
    return uploadedPaths.filter(Boolean);
  };

  const callImageGenerationAPI = async (endpoint, bodyPayload) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required for generation.");
    
    const response = await fetch(`${API_URL}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(bodyPayload) });
    if (!response.ok) {
      const d = await response.json().catch(()=>{});
      if (response.status === 402) throw new Error(d.message || "Insufficient credits.");
      throw new Error(d.error || "Generation failed.");
    }
    return (await response.json()).results;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = Date.now();
    if (generationLoading || (now - lastRequestTime < 500) || !prompt.trim()) return;
    setLastRequestTime(now);

    if (creditsState.credits && numImages > creditsState.credits.available_credits) {
      setPageError(`Need ${numImages - creditsState.credits.available_credits} more credits.`);
      return;
    }
    setGenerationLoading(true); setPageError(null);

    try {
      let results = [];
      const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const basePayload = { prompt, count: numImages, requestId, size: imageSize };

      if (files.length > 0) {
        const filepaths = await uploadAllImages();
        if (filepaths.length === 0 && files.length > 0) throw new Error("Failed to upload reference images.");
        results = await callImageGenerationAPI('/generate/multiple-references', { ...basePayload, filepaths });
      } else {
        results = await callImageGenerationAPI('/generate/multiple', basePayload);
      }

      if (!results || results.length === 0) throw new Error("No images were generated.");
      
      const formattedResults = results.map((result, index) => ({ ...result, id: result.id || `${Date.now()}-${index}`, timestamp: new Date().toISOString() }));
      setUserGeneratedImages(prev => [...formattedResults, ...prev]); // Prepend new images
      loadUserCreditsAndSubscription();
    } catch (err) {
      setPageError(err.message);
    } finally {
      setGenerationLoading(false);
    }
  };

  const handleDownload = (base64Image, index) => {
    const link = document.createElement("a"); link.href = base64Image; link.download = `ad_image_${index}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleCopyImage = async (imageBase64) => {
    try {
      const r = await fetch(imageBase64); const b = await r.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]); alert("Image copied!");
    } catch (err) { alert("Copy failed. Auto-downloading..."); handleDownload(imageBase64, Date.now()); }
  };

  const handleOpenModal = (image) => { setSelectedImage(image); setModalOpen(true); };

  const handleDeleteImage = async (imageId) => {
    try {
      await fetchApiData(`/user/images/${imageId}`, { method: "DELETE" });
      setUserGeneratedImages(prev => prev.filter(img => img.id !== imageId));
      if (selectedImage?.id === imageId) setModalOpen(false);
    } catch (err) { setPageError(`Delete error: ${err.message}`); }
  };

  const downloadZip = async (imagesToDownload, zipNamePrefix) => {
    if (imagesToDownload.length === 0) return;
    setIsDownloading(true); setDownloadProgress(0);
    try {
      const zip = new JSZip(); const f = zip.folder(zipNamePrefix);
      for (let i = 0; i < imagesToDownload.length; i++) {
        const img = imagesToDownload[i]; if (img.error || !img.base64Image) continue;
        f.file(`img-${i+1}-${img.id}.png`, img.base64Image.split(",")[1], {base64:true});
        setDownloadProgress(Math.round(((i+1)/imagesToDownload.length)*100));
      }
      zip.file("README.txt",`# PostoraAI Images\nDownloaded: ${new Date().toISOString()}\nImages expire after 7 days.`);
      saveAs(await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}}), `${zipNamePrefix}-${Date.now()}.zip`);
    } catch (e) { alert("Zip creation failed."); } 
    finally { setIsDownloading(false); setDownloadProgress(0); }
  };

  const handleDownloadAll = () => downloadZip(userGeneratedImages, "postoraai-all-images");
  const handleDownloadSelected = () => {
    const ids = Object.keys(selectedUiImages).filter(id => selectedUiImages[id]);
    downloadZip(userGeneratedImages.filter(img => ids.includes(img.id)), "postoraai-selected-images");
  };
  const handleDeleteSelected = () => {
    const ids = Object.keys(selectedUiImages).filter(id => selectedUiImages[id]);
    if (ids.length===0 || !window.confirm(`Delete ${ids.length} image(s)?`)) return;
    ids.forEach(id => handleDeleteImage(id)); setSelectedUiImages({});
  };

  const handleFunPromptClick = (text) => { setPrompt(text); promptInputRef.current?.focus(); };
  const handleLogout = async () => { await signOut(); navigate("/"); };
  
  const sidebarMenuContent = useMemo(() => (
    <div className="pt-4 pb-8 flex flex-col gap-6">
      <UserCredits credits={creditsState.credits} creditsLoading={creditsState.creditsLoading} subscription={creditsState.subscription} onRefresh={loadUserCreditsAndSubscription} error={creditsState.creditsError}/>
      <div className="flex flex-col gap-3 mt-4 px-4">
        {[ {label: "Home", icon: Home, path: "/"}, {label: "Account", icon: User, path: "/account"} ].map(item => ( <button key={item.label} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-background/10 text-white font-semibold text-base hover:bg-pastel-blue/10" onClick={() => { setMobileSidebarOpen(false); navigate(item.path); }}><item.icon size={18} className="text-pastel-blue" /> {item.label}</button> ))}
        <button className="flex items-center gap-2 px-4 py-3 rounded-lg bg-background/10 text-white font-semibold text-base hover:bg-pastel-blue/10" onClick={() => { setMobileSidebarOpen(false); handleLogout(); }}><LogOut size={18} className="text-pastel-blue" /> Log Out</button>
      </div>
    </div>
  ),[creditsState, loadUserCreditsAndSubscription, navigate, handleLogout]);

  const desktopSidebarContent = useMemo(() => (
    <div className="w-80 p-6 bg-[#23262F] border-l border-[#23262F]/60 overflow-y-auto">
      <div className="mb-8"><UserCredits credits={creditsState.credits} creditsLoading={creditsState.creditsLoading} subscription={creditsState.subscription} onRefresh={loadUserCreditsAndSubscription} error={creditsState.creditsError} /></div>
      <div className="hidden md:block">
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">How Many Visuals?</h2>
          {!creditsState.creditsLoading && creditsState.credits && (<div className={`mb-4 p-3 rounded-lg text-sm ${creditsState.credits.available_credits < numImages ? "bg-pastel-pink/20 text-pastel-pink border-pastel-pink/20" : "bg-green-100/10 text-green-300 border-green-200/20"}`}><div className="flex items-center"><Zap size={14} className="mr-2 shrink-0" /><span className="font-medium">{creditsState.credits.available_credits<numImages?`Need ${numImages-creditsState.credits.available_credits} more`:`${creditsState.credits.available_credits} available`} credit{creditsState.credits.available_credits!==1?"s":""}</span></div>{creditsState.credits.available_credits<numImages && (<Link to="/account" className="mt-2 block text-center w-full px-3 py-1.5 bg-pastel-blue text-[#181A20] rounded-md text-xs font-medium shadow-sm hover:shadow">Get More</Link>)}</div>)}
          <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(n=>(<motion.button key={n} whileHover={{scale:numImages!==n?1.05:1}} whileTap={{scale:0.95}} onClick={()=>setNumImages(n)} className={`rounded-lg py-3 font-semibold ${numImages===n?"bg-pastel-blue text-charcoal shadow-md":"bg-background text-foreground hover:bg-pastel-blue/80 border border-border"}`}>{n}</motion.button>))}</div>
          <p className="text-xs text-charcoal/60 mt-3 text-center">1 credit per image</p>
        </div>
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Image Size</h2>
          <div className="space-y-2">{[{l:"Square",v:"1024x1024",i:<div className="w-8 h-8 border-2 border-current rounded"/>},{l:"Landscape",v:"1536x1024",i:<div className="w-10 h-7 border-2 border-current rounded"/>},{l:"Portrait",v:"1024x1536",i:<div className="w-7 h-10 border-2 border-current rounded"/>}].map(o=>(<motion.button key={o.v} whileHover={{scale:imageSize!==o.v?1.02:1}} whileTap={{scale:0.98}} onClick={()=>setImageSize(o.v)} className={`w-full p-3 rounded-lg flex items-center justify-between border ${imageSize===o.v?"bg-pastel-blue/20 border-pastel-blue text-white":"bg-background/20 border-background/40 text-white/70 hover:border-pastel-blue/40"}`}><div className="flex items-center"><div className="w-12 h-12 bg-background/30 rounded flex items-center justify-center mr-3">{o.i}</div><div className="text-left"><div className="font-medium">{o.l}</div><div className="text-xs opacity-70">{o.v.replace('x',' × ')}</div></div></div>{imageSize===o.v && (<div className="w-5 h-5 rounded-full bg-pastel-blue flex items-center justify-center"><Check size={12} className="text-[#181A20]"/></div>)}</motion.button>))}</div>
        </div>
        <div><h2 className="text-lg font-bold mb-3">Tips</h2><div className="p-3 rounded-lg bg-background/20 border border-border/20 space-y-3"><p className="text-sm text-white/70"><span className="text-pastel-blue font-medium block mb-1">Be specific:</span> Describe lighting, environment, style.</p><p className="text-sm text-white/70"><span className="text-pastel-blue font-medium block mb-1">Try multiple:</span> Max 4 products for complex scenes.</p></div></div>
      </div>
    </div>
  ),[creditsState, numImages, imageSize, loadUserCreditsAndSubscription]);

  return (
    <div className="min-h-screen flex bg-[#181A20] text-gray-100">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
      <div className="hidden sm:flex w-16 bg-[#23262F] shadow flex-col items-center py-6 space-y-6 border-r border-[#23262F]/60">
        <div className="flex items-center justify-center rounded-full bg-pastel-blue/20 p-2"><ImagePlus size={20} className="text-pastel-blue" /></div>
        <SidebarIcon icon={<User size={20} />} onClick={() => navigate("/account")} aria-label="Account" />
        <SidebarIcon icon={<Home size={20} />} onClick={() => navigate("/")} aria-label="Home"/>
        <div className="mt-auto"><SidebarIcon icon={<LogOut size={20} />} onClick={handleLogout} aria-label="Logout"/></div>
      </div>

      <AnimatePresence>{mobileSidebarOpen && (<motion.div initial={{x:"-100%",opacity:0}} animate={{x:0,opacity:1}} exit={{x:"-100%",opacity:0}} transition={{type:"spring",stiffness:300,damping:30}} className="fixed inset-0 z-[110] flex sm:hidden"><div className="fixed inset-0 bg-black opacity-80 z-[110]" onClick={()=>setMobileSidebarOpen(false)}/><motion.div initial={{x:"-100%"}} animate={{x:0}} exit={{x:"-100%"}} className="relative w-[90vw] max-w-[22rem] h-full bg-[#23262F] border-r border-[#23262F]/60 shadow-2xl z-[120] p-0 overflow-y-auto" onClick={e=>e.stopPropagation()}><button className="sticky top-0 right-0 z-[130] p-2 m-2 rounded-full bg-[#23262F] hover:bg-pastel-blue/10" onClick={()=>setMobileSidebarOpen(false)} aria-label="Close menu"><X className="h-6 w-6 text-pastel-blue"/></button>{sidebarMenuContent}</motion.div></motion.div>)}</AnimatePresence>

      <div className="flex-1 flex flex-col bg-[#181A20] min-h-screen">
        <header className="bg-[#23262F] px-2 sm:px-6 py-2 sm:py-4 shadow flex items-center justify-between border-b border-[#23262F]/60 min-h-[48px]">
          <button className="sm:hidden p-2 rounded-lg hover:bg-pastel-blue/10" onClick={()=>setMobileSidebarOpen(true)} aria-label="Open menu"><Menu className="h-7 w-7 text-pastel-blue"/></button>
          <div className="flex items-center min-w-0"><h1 className="text-lg sm:text-2xl font-extrabold text-white truncate"><span className="text-pastel-blue">PostoraAI</span> Studio</h1>
            {!creditsState.creditsLoading && creditsState.credits && (<Link to="/account" className="ml-6 hidden sm:flex items-center text-sm bg-pastel-blue/10 hover:bg-pastel-blue/20 px-3 py-1 rounded-full text-pastel-blue border-pastel-blue/30"><Zap size={14} className="mr-1"/><span className="font-medium">{creditsState.credits.available_credits}</span><span className="text-pastel-blue/80 ml-1">credits</span></Link>)}
          </div>
          <div className="flex space-x-1 bg-[#23262F] rounded-lg p-1">{["create","gallery"].map(t=>(<motion.button key={t} onClick={()=>setActiveTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${activeTab===t?"bg-[#181A20] shadow-sm text-white":"text-gray-300 hover:text-white hover:bg-[#23262F]/80"}`}>{t}{t==="gallery"&&userGeneratedImages.length>0&&` (${userGeneratedImages.length})`}</motion.button>))}</div>
        </header>

        <div className="flex flex-1 overflow-y-auto">
          <main className="flex-1 flex flex-col overflow-y-auto">
            {pageError && (<motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="w-full max-w-5xl mx-auto mt-6 mx-6 bg-pastel-pink/20 border-pastel-pink/50 rounded-lg p-4 text-red-400"><p className="font-medium">Error: {pageError}</p>{pageError.includes("gallery") && <button onClick={loadUserGeneratedImages} className="mt-2 text-sm underline">Try Again</button>}</motion.div>)}
            <div className="flex-1 p-6 overflow-hidden">
              {activeTab === "create" && (
                <div className="w-full max-w-5xl mx-auto">
                  {generationLoading ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">{Array.from({length:numImages}).map((_,i)=>(<div key={i} className="aspect-square bg-[#23262F] rounded-xl animate-pulse shadow-sm border-[#23262F]/60 overflow-hidden"><div className="w-full h-full bg-gradient-to-br from-[#23262F]/40 to-[#181A20]"/></div>))}</div>
                  ) : (
                    <div className="space-y-8">
                      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="text-center py-8 bg-[#23262F] rounded-xl border border-[#23262F]/60 shadow-sm">
                        {previews.length===0?(<div className="flex flex-col items-center justify-center p-10"><motion.div className="p-6 bg-pastel-blue/20 rounded-full mb-6" whileHover={{scale:1.05}}><ImagePlus size={36} className="text-pastel-blue"/></motion.div><h3 className="text-2xl font-semibold mb-3 text-white">Create Your Scene</h3><p className="text-gray-300 max-w-md mx-auto mb-8">Upload images, choose a style, let AI transform them.</p><motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} className="bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] px-8 py-4 rounded-full font-semibold shadow-md" onClick={()=>fileInputRef.current?.click()}><FileUp className="h-5 w-5 mr-2 inline"/>Upload Images</motion.button></div>
                        ) : (
                          <div className="p-6"><h3 className="text-2xl font-semibold mb-6 text-white">Your Product Images</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-6">{previews.map((p,i)=>(<motion.div key={`p-${i}`} className="relative rounded-lg overflow-hidden shadow-sm border border-[#23262F]/60 group aspect-square" whileHover={{scale:1.03}}><img src={p} alt={`Up ${i+1}`} className="object-cover w-full h-full"/><motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={()=>handleRemoveImage(i)} className="absolute top-2 right-2 bg-[#23262F] p-1.5 rounded-full shadow-md opacity-80 hover:opacity-100 z-10"><X size={14} className="text-pastel-blue"/></motion.button><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center p-2"><p className="text-white text-xs text-center font-medium truncate">{files[i]?.name||`Img ${i+1}`}</p></div></motion.div>))}{previews.length<4 && (<motion.button whileHover={{scale:1.03,backgroundColor:"rgba(123,223,242,0.1)"}} whileTap={{scale:0.97}} className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-pastel-blue/20 rounded-lg hover:bg-pastel-blue/10 aspect-square" onClick={()=>fileInputRef.current?.click()}><Plus size={24} className="text-pastel-blue"/><span className="text-xs text-pastel-blue">Add</span></motion.button>)}</div>
                            {previews.length>1 && (<div className="mt-2 p-3 bg-pastel-blue/10 rounded-lg border-pastel-blue/20 max-w-lg mx-auto"><p className="text-sm text-white/80"><span className="font-medium text-pastel-blue">Multi-image:</span> {previews.length} images combined.</p></div>)}
                            <CategorizedPrompts onPromptClick={handleFunPromptClick}/>
                          </div>
                        )}
                      </motion.div>
                      {userGeneratedImages.length>0 && (<div className="space-y-4"><div className="flex items-center justify-between"><h3 className="text-xl font-semibold text-white">Recently Generated</h3><Link to="#" onClick={()=>setActiveTab("gallery")} className="text-sm text-pastel-blue hover:underline">View all</Link></div><div className="bg-[#23262F] p-4 rounded-xl border border-[#23262F]/60 shadow-sm"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{userGeneratedImages.slice(0,4).map((img,i)=>(<motion.div key={`rec-${img.id||i}`} whileHover={{y:-5}} className="relative group rounded-lg overflow-hidden bg-[#1F222A] shadow-sm border-[#1F222A]/80"><div className="aspect-square cursor-pointer" onClick={()=>handleOpenModal(img)}><img src={img.base64Image} alt={`Gen ${i+1}`} className="w-full h-full object-cover"/></div><div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100"><div className="flex justify-center space-x-2"><button onClick={()=>handleDownload(img.base64Image,i)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded text-white" title="Download"><Download size={14}/></button><button onClick={()=>handleCopyImage(img.base64Image)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded text-white" title="Copy"><Copy size={14}/></button></div></div></motion.div>))}</div></div></div>)}
                    </div>
                  )}
                </div>
              )}
              {activeTab === "gallery" && (
                <div className="w-full max-w-6xl mx-auto flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4"><div><h2 className="text-2xl font-bold text-white">Your Generated Visuals</h2><p className="text-gray-300 text-sm mt-1">{userGeneratedImages.length>0?`${userGeneratedImages.length} image${userGeneratedImages.length!==1?"s":""} • Images expire after 7 days`:"Create visuals to see them here"}</p></div></div>
                  {isLoadingUserImages?(<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">{Array.from({length:8}).map((_,i)=>(<div key={`skel-${i}`} className="rounded-xl bg-[#23262F] border border-[#23262F]/60 shadow-sm overflow-hidden"><div className="aspect-square bg-gradient-to-r from-[#181A20] to-[#23262F]/40 animate-pulse"/><div className="p-4"><div className="h-4 bg-[#23262F]/60 rounded animate-pulse mb-2 w-2/3"/><div className="h-3 bg-[#23262F]/40 rounded animate-pulse w-1/3"/></div></div>))}</div>
                  ):userGeneratedImages.length>0?(<div className="bg-[#23262F] p-6 rounded-2xl border border-[#23262F]/60 shadow-sm flex-grow overflow-y-auto">
                    {Object.values(selectedUiImages).some(v=>v) && (<div className="mb-4 p-4 rounded-lg bg-[#181A20] border-[#181A20]/60 flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-white font-medium">{Object.values(selectedUiImages).filter(v=>v).length} selected</span><button onClick={()=>setSelectedUiImages(userGeneratedImages.reduce((a,img)=>({...a,[img.id]:!img.error}),{}))} className="text-sm text-white/70 hover:text-pastel-blue">Select all</button><button onClick={()=>setSelectedUiImages({})} className="text-sm text-white/70 hover:text-pastel-blue">Clear</button></div><div className="flex gap-2"><motion.button onClick={handleDownloadSelected} disabled={isDownloading} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDownloading?"bg-pastel-blue/30 text-pastel-blue/60 cursor-not-allowed":"bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20]"}`}>{isDownloading?<><div className="w-3 h-3 border-2 border-t-transparent border-[#181A20]/60 rounded-full animate-spin mr-1"/>{downloadProgress}%</>:<><Download size={14}/>Download</>}</motion.button><motion.button onClick={handleDeleteSelected} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-pastel-pink hover:bg-pastel-pink/80 text-white"><Trash2 size={14}/>Delete</motion.button></div></div>)}
                    {!Object.values(selectedUiImages).some(v=>v) && (<div className="mb-4 flex items-center justify-end gap-2"><motion.button onClick={handleDownloadAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20]"><Download size={14}/>Download All</motion.button></div>)}
                    <ImageGrid images={userGeneratedImages} onDownload={handleDownload} onCopy={handleCopyImage} onModalOpen={handleOpenModal} onDelete={handleDeleteImage} selectedImages={selectedUiImages} setSelectedImages={setSelectedUiImages}/>
                  </div>
                  ):(<motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-[#23262F] rounded-xl border-[#23262F]/60 shadow-sm p-8 text-center"><div className="w-16 h-16 bg-[#181A20] rounded-full flex items-center justify-center mx-auto mb-4"><ImagePlus size={24} className="text-pastel-blue opacity-60"/></div><h3 className="text-xl font-semibold mb-2 text-white">No images yet</h3><p className="text-gray-300 mb-6 max-w-md mx-auto">Upload product photos and describe scene.</p><motion.button onClick={()=>setActiveTab("create")} className="px-6 py-3 bg-pastel-blue hover:bg-pastel-blue/90 text-[#181A20] font-medium rounded-lg shadow-sm">Create First Image</motion.button></motion.div>)}
                </div>
              )}
            </div>
          </main>
          <aside className="hidden md:block">{desktopSidebarContent}</aside>
        </div>

        <form onSubmit={handleSubmit} className="bg-background border-t border-border p-3 sm:p-6 sticky bottom-0 z-10 shadow-md">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-stretch gap-2 sm:gap-4">
            <div className="flex-1 relative">
              <div className="flex sm:hidden items-center gap-4 mb-2 px-1 relative z-20">
                <div className="relative"><button type="button" className={`p-2 rounded-full bg-background border border-border hover:bg-pastel-blue/10 ${showStylePopover?"ring-2 ring-pastel-blue":""}`} title="Image style" onClick={()=>{setShowStylePopover(v=>!v);setShowNumPopover(false)}}><Image className="h-5 w-5"/></button>{showStylePopover && (<div className="absolute left-0 bottom-full mb-2 w-40 bg-background border border-border rounded-lg shadow-lg z-30">{[{l:"Square",v:"1024x1024"},{l:"Landscape",v:"1536x1024"},{l:"Portrait",v:"1024x1536"}].map(o=>(<button key={o.v} className={`w-full text-left px-4 py-2 text-sm hover:bg-pastel-blue/10 ${imageSize===o.v?"font-bold text-pastel-blue":""}`} onClick={()=>{setImageSize(o.v);setShowStylePopover(false)}}>{o.l}</button>))}</div>)}</div>
                <div className="relative"><button type="button" className={`p-2 rounded-full bg-background border border-border hover:bg-pastel-blue/10 text-sm font-bold ${showNumPopover?"ring-2 ring-pastel-blue":""}`} title="Number of images" onClick={()=>{setShowNumPopover(v=>!v);setShowStylePopover(false)}}><SlidersHorizontal className="h-5 w-5 inline mr-1"/>{numImages}x</button>{showNumPopover && (<div className="absolute left-0 bottom-full mb-2 w-28 bg-background border border-border rounded-lg shadow-lg z-30">{[1,2,3,4].map(n=>(<button key={n} className={`w-full text-left px-4 py-2 text-sm hover:bg-pastel-blue/10 ${numImages===n?"font-bold text-pastel-blue":""}`} onClick={()=>{setNumImages(n);setShowNumPopover(false)}}>{n} image{n>1?"s":""}</button>))}</div>)}</div>
                <button type="button" className="p-2 rounded-full bg-background border border-border hover:bg-pastel-blue/10" title="Upload images" onClick={()=>fileInputRef.current?.click()}><FileUp className="h-5 w-5"/></button>
              </div>
              <textarea ref={promptInputRef} value={prompt} onChange={e=>setPrompt(e.target.value)} rows="2" placeholder="Describe your scene..." className="w-full p-2 sm:p-4 bg-background border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-pastel-blue focus:border-transparent shadow-sm hover:shadow text-foreground text-sm sm:text-base" onBlur={()=>{setShowStylePopover(false);setShowNumPopover(false)}}/>
              <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 text-xs text-charcoal/40">{prompt.length}/300</div>
            </div>
            <motion.button type="submit" disabled={!prompt.trim()||generationLoading||previews.length===0} className={`w-full sm:w-auto px-4 py-2 sm:px-8 sm:py-4 rounded-xl font-bold shadow-md text-sm sm:text-base ${!prompt.trim()||generationLoading||previews.length===0?"bg-pastel-blue/30 text-pastel-blue/80 cursor-not-allowed":"bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal"}`}>{generationLoading?<div className="flex items-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-charcoal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generating...</div>:"Generate"}</motion.button>
          </div>
        </form>
      </div>
      <ImageModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} image={selectedImage} onDownload={handleDownload} onCopy={handleCopyImage} onDelete={handleDeleteImage}/>
    </div>
  );
}

export default AdCreator;