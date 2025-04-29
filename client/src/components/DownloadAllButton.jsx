// client/src/components/DownloadAllButton.jsx
import React, { useState } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const DownloadAllButton = ({ images }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleDownloadAll = async () => {
    if (!images || images.length === 0 || loading) return;
    
    setLoading(true);
    setProgress(0);
    try {
      const zip = new JSZip();
      const imageFolder = zip.folder("generated-images");
      
      // Get only valid images
      const validImages = images.filter(img => !img.error && img.base64Image);
      
      // Add each image to the zip file
      for (let i = 0; i < validImages.length; i++) {
        const image = validImages[i];
        
        // Extract base64 data (remove the data:image/png;base64, prefix)
        const base64Data = image.base64Image.split(',')[1];
        
        // Add to zip with a descriptive filename
        const fileName = `image-${i+1}-${new Date(image.created_at).toISOString().slice(0,10)}.png`;
        imageFolder.file(fileName, base64Data, {base64: true});
        
        // Update progress
        setProgress(Math.round(((i + 1) / validImages.length) * 100));
      }
      
      // Generate readme explaining expiration
      const readme = 
`# Generated Images
This archive contains images generated with Ad Wizard.

Important: These images will expire 7 days after their creation date.
Please save them to your own storage if you wish to keep them longer.

Total images: ${validImages.length}
Download date: ${new Date().toISOString().slice(0,10)}

Enjoy your images!`;

      imageFolder.file("README.txt", readme);
      
      // Generate the zip file
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      });
      
      // Save the zip file
      saveAs(content, `all-generated-images-${new Date().toISOString().slice(0,10)}.zip`);
    } catch (error) {
      console.error('Error downloading all images:', error);
      alert('Failed to download images. Please try again.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };
  
  // Don't render the button if there are no images
  if (!images || images.length === 0) return null;
  
  // Count valid images
  const validImageCount = images.filter(img => !img.error && img.base64Image).length;
  
  if (validImageCount === 0) return null;
  
  return (
    <div>
      {/* Show information about imminent expiration */}
      {images.some(img => img.daysRemaining && img.daysRemaining <= 2) && (
        <div className="mb-2 p-2 rounded-lg bg-pastel-pink/10 text-xs text-pastel-pink flex items-start gap-1.5">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Warning:</span> Some images will expire soon. 
            Download them to save permanently.
          </div>
        </div>
      )}
      
      <button
        onClick={handleDownloadAll}
        disabled={loading}
        className={`flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
          loading
            ? 'bg-pastel-blue/50 text-pastel-blue cursor-not-allowed'
            : 'bg-pastel-blue/10 hover:bg-pastel-blue/20 text-pastel-blue'
        }`}
      >
        <Download size={16} />
        {loading ? (
          <div className="flex items-center gap-2">
            <span>Downloading... {progress}%</span>
            <div className="w-24 h-1.5 bg-pastel-blue/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-pastel-blue transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <span>Download All ({validImageCount})</span>
        )}
      </button>
    </div>
  );
};

export default DownloadAllButton;