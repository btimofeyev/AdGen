import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, Camera, Share2 } from 'lucide-react';

const CategorizedPrompts = ({ onPromptClick }) => {
  const [activeCategory, setActiveCategory] = useState('ads');

  // Categories with their respective icons
  const categories = [
    { id: 'ads', name: 'Ads', icon: <Tag size={16} /> },
    { id: 'product', name: 'Product Shots', icon: <Camera size={16} /> },
    { id: 'social', name: 'Social Posts', icon: <Share2 size={16} /> }
  ];

  // Prompts organized by category
  const prompts = {
    ads: [
      "Create a professional advertisement showcasing my product on a marble countertop with soft natural lighting and minimal props",
      "Transform my product into a lifestyle ad with models using it in an upscale home setting with warm lighting",
      "Design a seasonal advertisement featuring my product with festive decorations and a cozy winter scene",
      "Create a bold, attention-grabbing advertisement with my product as the hero against a vibrant colored background",
      "Generate a luxury advertisement placing my product in an elegant, high-end environment with sophisticated styling"
    ],
    product: [
      "Capture my product from above on a clean white background with subtle shadows for e-commerce",
      "Create a detailed product shot highlighting texture and materials with macro-style photography",
      "Show my product in a 45-degree angle product shot with studio lighting on a gradient background",
      "Design a minimalist product shot with my item centered on a simple pastel background with perfect lighting",
      "Generate a technical product shot that clearly displays all features and details with precision lighting"
    ],
    social: [
      "Style my product in a casual, lifestyle scene perfect for Instagram with plants and natural elements",
      "Create an eye-catching flat lay composition with my product surrounded by complementary items",
      "Show my product in an outdoor adventure setting that tells a story for social media engagement",
      "Design a behind-the-scenes style image showing my product in the making or being used authentically",
      "Generate a seasonal social media post featuring my product styled for the current holiday or season"
    ]
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-3">Quick Prompt Ideas</h2>
      
      {/* Category Tabs */}
      <div className="flex mb-4 bg-[#23262F] rounded-full p-1 max-w-fit">
        {categories.map(category => (
          <motion.button
            key={category.id}
            whileHover={{ scale: activeCategory !== category.id ? 1.05 : 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === category.id
                ? 'bg-pastel-blue text-[#181A20]'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </motion.button>
        ))}
      </div>
      
      {/* Prompt Buttons */}
      <div className="flex flex-wrap gap-2">
        {prompts[activeCategory].map((prompt, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(123, 223, 242, 0.25)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPromptClick(prompt)}
            className="text-sm text-pastel-blue bg-pastel-blue/10 hover:bg-pastel-blue/20 py-2 px-3 rounded-lg font-medium transition-all"
          >
            {prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CategorizedPrompts;