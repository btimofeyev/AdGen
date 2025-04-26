// client/src/components/TemplateSelector.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Grid, Layout, ShoppingBag, Tag, Gift, Calendar, RefreshCw } from "lucide-react";

// Template categories with their associated templates
const TEMPLATES = {
  product: [
    {
      id: 'product-showcase',
      name: 'Product Showcase',
      description: 'Highlight your product features and benefits',
      icon: <ShoppingBag size={18} />,
      formats: ['Instagram Post', 'Facebook Ad'],
      themes: ['New Arrival', 'Featured Product'],
      prompts: [
        "Create a clean, minimalist product showcase with the product as the hero. Add subtle shadows and a light background. Include a short headline emphasizing the main benefit.",
        "Design a lifestyle image featuring this product in a real-world setting. Show the product being used by a person (don't show their face). Add space for product name and price."
      ]
    },
    {
      id: 'product-collection',
      name: 'Product Collection',
      description: 'Display multiple items from your product line',
      icon: <Grid size={18} />,
      formats: ['Instagram Post', 'Email Header'],
      themes: ['New Collection', 'Seasonal Line'],
      prompts: [
        "Create a grid-style layout featuring the main product alongside complementary items. Use a neutral background and consistent spacing. Add a title area at the top for the collection name.",
        "Design a banner showcasing this product as part of a collection. Use a lifestyle background that fits the product category. Add text overlay: 'View the Collection'"
      ]
    }
  ],
  promotional: [
    {
      id: 'sales-promo',
      name: 'Sales Promotion',
      description: 'Announce discounts and limited-time offers',
      icon: <Tag size={18} />,
      formats: ['Instagram Story', 'Facebook Ad', 'Email Header'],
      themes: ['Flash Sale', 'Weekend Deal', 'Clearance'],
      prompts: [
        "Create a bold, attention-grabbing sales promotion featuring the product with a prominent discount callout. Use eye-catching typography and high contrast colors. Add urgency with 'Limited Time Only' messaging.",
        "Design a clean, elegant sales announcement with the product image on the right and text on the left. Use subtle price strike-through visualization. Include 'Shop Now' call-to-action at the bottom."
      ]
    },
    {
      id: 'special-offer',
      name: 'Special Offer',
      description: 'Promote bundles, gifts with purchase, or exclusive deals',
      icon: <Gift size={18} />,
      formats: ['Instagram Post', 'Web Banner', 'Email Header'],
      themes: ['Bundle Deal', 'Free Gift', 'Members Only'],
      prompts: [
        "Create a special offer advertisement showing this product paired with a bonus item or gift. Use a ribbon or badge to highlight the added value. Include text: 'Special Offer: Limited Time'.",
        "Design a bundle promotion with this main product. Visualize a 'buy one, get one' or similar offer. Use packaging elements like gift boxes or bows if appropriate. Add text area for offer details."
      ]
    }
  ],
  seasonal: [
    {
      id: 'holiday-theme',
      name: 'Holiday Theme',
      description: 'Seasonal promotions tied to holidays and events',
      icon: <Calendar size={18} />,
      formats: ['Instagram Post', 'Facebook Ad', 'Email Header'],
      themes: ["Valentine's Day", 'Summer Break', 'Holiday Season', 'Back to School'],
      prompts: [
        "Create a festive holiday-themed advertisement featuring this product with seasonal decorative elements appropriate for the selected holiday. Keep the product as the focal point. Add a seasonal greeting and promotion message.",
        "Design a seasonal promotion with subtle holiday elements in the background. Style the product to fit the season with complementary colors. Include space for a holiday-specific offer or message."
      ]
    },
    {
      id: 'seasonal-use',
      name: 'Seasonal Use',
      description: 'Show how your product fits into seasonal activities',
      icon: <RefreshCw size={18} />,
      formats: ['Instagram Post', 'Instagram Story', 'Facebook Ad'],
      themes: ['Summer Ready', 'Fall Favorites', 'Winter Essentials'],
      prompts: [
        "Create a lifestyle image showing how this product is used during the current season. Incorporate seasonal elements like beach, snow, fall leaves, or spring flowers as appropriate. Add text overlay highlighting seasonal benefit.",
        "Design a season-transition advertisement showing this product as essential for the upcoming season. Use split imagery showing before/after or current/upcoming seasonal contexts. Include text: 'Get Ready for [Season]'"
      ]
    }
  ]
};

// Template display card component
const TemplateCard = ({ template, onClick, selected }) => {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2 }}
      className={`cursor-pointer rounded-xl border p-4 transition-colors ${
        selected 
          ? 'border-blue-400 bg-blue-50/50' 
          : 'border-zinc-200 bg-white hover:border-blue-200 hover:bg-blue-50/30'
      }`}
      onClick={() => onClick(template)}
    >
      <div className="flex items-start gap-3">
        {/* Icon container */}
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
          selected ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-700'
        }`}>
          {template.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-zinc-900">{template.name}</h3>
          <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{template.description}</p>
          
          {/* Tags */}
          <div className="mt-2 flex flex-wrap gap-1">
            {template.formats.slice(0, 2).map((format, idx) => (
              <span key={idx} className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                {format}
              </span>
            ))}
            {template.formats.length > 2 && (
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                +{template.formats.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Main component
const TemplateSelector = ({ onSelectTemplate }) => {
  const [activeCategory, setActiveCategory] = useState('product');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Handle template selection
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    if (onSelectTemplate) {
      // Get a random prompt from the selected template
      const randomPrompt = template.prompts[Math.floor(Math.random() * template.prompts.length)];
      // Get a random theme from the selected template
      const randomTheme = template.themes[Math.floor(Math.random() * template.themes.length)];
      // Get a random format from the selected template
      const randomFormat = template.formats[Math.floor(Math.random() * template.formats.length)];
      
      onSelectTemplate({
        prompt: randomPrompt,
        theme: randomTheme,
        format: randomFormat
      });
    }
  };
  
  // Filter templates based on search term
  const getFilteredTemplates = () => {
    if (!searchTerm.trim()) {
      return TEMPLATES[activeCategory];
    }
    
    const term = searchTerm.toLowerCase();
    const allTemplates = Object.values(TEMPLATES).flat();
    
    return allTemplates.filter(template => 
      template.name.toLowerCase().includes(term) ||
      template.description.toLowerCase().includes(term) ||
      template.themes.some(theme => theme.toLowerCase().includes(term)) ||
      template.formats.some(format => format.toLowerCase().includes(term))
    );
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  const filteredTemplates = getFilteredTemplates();
  
  return (
    <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-zinc-200/90">
        <h2 className="text-lg font-medium text-zinc-900 flex items-center gap-2">
          <Layout className="h-5 w-5 text-blue-600" />
          Templates
        </h2>
        
        {/* Search box */}
        <div className="relative mt-3">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-300/90 px-4 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Category tabs - Only show when not searching */}
      {!searchTerm && (
        <div className="border-b border-zinc-200/90">
          <div className="flex px-3 space-x-1">
            {Object.keys(TEMPLATES).map((category) => (
              <button
                key={category}
                className={`py-3 px-4 font-medium text-sm rounded-t-lg transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                  activeCategory === category
                    ? 'text-black font-semibold border-b-2 border-black' 
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100/70 focus-visible:ring-zinc-500'
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Templates grid */}
      <motion.div 
        className="p-4 max-h-96 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <motion.div key={template.id} variants={itemVariants}>
              <TemplateCard 
                template={template} 
                onClick={handleSelectTemplate}
                selected={selectedTemplate && selectedTemplate.id === template.id}
              />
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 py-8 text-center text-zinc-500">
            <p>No templates found for "{searchTerm}"</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TemplateSelector;