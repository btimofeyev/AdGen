import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card"; // Assuming these are ShadCN/ui components or similar
import { Button } from "./ui/button"; // Assuming these are ShadCN/ui components or similar

const motionContainerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const motionItemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const GalleryImageCard = React.memo(({ image, index, onDownload, onCopyImage }) => {
  const { theme, format, error, base64Image } = image;

  return (
    <motion.div variants={motionItemVariants}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={theme || "Untitled Image"}>
              {theme || "Untitled Image"}
            </h3>
            {format && (
              <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                {format}
              </span>
            )}
          </div>
          
          {error ? (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-xs">
              Error: {error}
            </div>
          ) : (
            <div className="relative group aspect-video"> {/* Or aspect-square if preferred */}
              <img 
                src={base64Image} 
                alt={`${theme || 'Generated'} advertisement`} 
                className="w-full h-full object-contain rounded-md bg-slate-50 dark:bg-slate-700"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="secondary" // Assuming this variant gives a light/white appearance
                    className="bg-white/90 hover:bg-white text-slate-800" // Adjusted for better contrast
                    onClick={() => onDownload && onDownload(base64Image, index)}
                    aria-label="Download image"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="bg-white/90 hover:bg-white text-slate-800"
                    onClick={() => onCopyImage && onCopyImage(base64Image, index)}
                    aria-label="Copy image"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        {!error && (onDownload || onCopyImage) && (
          <CardFooter className="p-3 pt-0 flex justify-end space-x-2"> {/* Changed to justify-end and space-x-2 */}
            {onDownload && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={() => onDownload(base64Image, index)}
              >
                <Download className="h-3 w-3 mr-1" /> Download
              </Button>
            )}
            {onCopyImage && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={() => onCopyImage(base64Image, index)}
              >
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
});

const ImageGallery = ({ images, onDownload }) => {
  const handleCopyImage = useCallback(async (imageBase64, index) => {
    if (!navigator.clipboard || !window.ClipboardItem) {
      console.warn("Clipboard API not fully supported. Falling back to download.");
      onDownload && onDownload(imageBase64, index); // Use onDownload prop as fallback
      alert("Image could not be copied. Download started instead.");
      return;
    }
    try {
      const fetchResponse = await fetch(imageBase64);
      const blob = await fetchResponse.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert('Image copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy image: ', err);
      alert('Failed to copy image. Please try downloading.');
    }
  }, [onDownload]); // Added onDownload to dependencies for fallback

  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 dark:text-slate-400">
        No images to display.
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[700px] overflow-y-auto pr-2" // Consider responsive columns like sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3
      variants={motionContainerVariants}
      initial="hidden"
      animate="show"
    >
      {images.map((image, index) => (
        <GalleryImageCard 
          key={image.id || `gallery-img-${index}`} // Use image.id if available, fallback to index
          image={image} 
          index={index} 
          onDownload={onDownload} 
          onCopyImage={handleCopyImage} // Pass the memoized copy handler
        />
      ))}
    </motion.div>
  );
};

export default ImageGallery;