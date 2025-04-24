import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const ImageGallery = ({ images, onDownload }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
      {images.map((item, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-3">
            <h3 className="text-sm font-medium mb-2">{item.theme}</h3>
            {item.error ? (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-xs">
                Error: {item.error}
              </div>
            ) : (
              <img 
                src={item.base64Image} 
                alt={`${item.theme} ad`} 
                className="w-full h-40 object-contain rounded-md bg-slate-50"
              />
            )}
          </CardContent>
          {!item.error && (
            <CardFooter className="p-3 pt-0">
              <Button 
                size="sm" 
                variant="secondary" 
                className="w-full"
                onClick={() => onDownload(item.base64Image, index)}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ImageGallery;