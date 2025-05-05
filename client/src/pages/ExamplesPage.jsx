// client/src/pages/ExamplesPage.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Sparkles, Tag, Clock, ShoppingBag, Home, Gift, Camera, Coffee, Laptop, Shirt } from "lucide-react";

const ExamplesPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  // Categories for filtering - added Fashion category
  const categories = [
    { id: 'all', name: 'All Examples', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'electronics', name: 'Electronics', icon: <Laptop className="h-4 w-4" /> },
    { id: 'fashion', name: 'Fashion', icon: <Shirt className="h-4 w-4" /> },
    { id: 'homegoods', name: 'Home Goods', icon: <Home className="h-4 w-4" /> },
    { id: 'food', name: 'Food & Beverage', icon: <Coffee className="h-4 w-4" /> },
    { id: 'gifts', name: 'Gifts & Accessories', icon: <Gift className="h-4 w-4" /> },
  ];

  // Example showcases - Updated with YETI tumbler example
  const examples = [
    {
      id: 1,
      category: 'electronics',
      title: 'Apple AirPods',
      description: 'Transformed a standard product shot into a lifestyle image showing the AirPods in a premium, active context.',
      before: '/examples/airpods-before.jpg',
      after: '/examples/airpods-after.png',
      prompt: 'A person holds an Apple AirPods Pro case open in their left hand aboard a subway at night, illuminated by warm city lights outside the windows. The tagline, "Hear What You’ve Been Missing," appears at the top in clean, modern typography, while the glossy white earbuds and charging case stand out in crisp focus against a soft, blurred background.',
      isKnownBrand: true,
      brandName: 'Apple'
    },
    {
      id: 2,
      category: 'homegoods',
      title: 'Handmade Ceramic Mug',
      description: 'Transformed a simple product shot into a cozy lifestyle scene that tells a story and creates emotional connection.',
      before: '/examples/mug-before.png',
      after: '/examples/mug-after.png',
      prompt: 'Put this product on a rustic wooden table with a book nearby, morning sunlight streaming in, cozy atmosphere',
    },
    {
      id: 3,
      category: 'fashion',
      title: 'Canvas Travel Backpack',
      description: 'Transformed a plain product photo into a storytelling lifestyle scene that evokes adventure, travel, and authenticity.',
      before: '/examples/canvasbackpack-before.png',
      after: '/examples/canvasbackpack-after.png',
      prompt: 'A rugged canvas backpack leaning against a weathered wooden bench in a sun-dappled park. A journal peeks out of the side pocket, with a pair of sunglasses resting nearby. Autumn leaves scattered on the ground, warm golden hour light filtering through trees, evoking a laid-back traveler or urban explorer vibe.',
      isKnownBrand: false
    },
    {
      id: 4,
      category: 'fashion',
      title: 'Retro Sunglasses',
      description: 'Turned a basic accessory photo into a vibrant lifestyle ad ready for social media, evoking summer, style, and relaxation.',
      before: '/examples/sunglasses-before.png',
      after: '/examples/sunglasses-after.png',
      prompt: 'Stylish retro sunglasses resting on a picnic blanket with a cold drink beside them, soft sunlight creating shadows. In the background, a beach bag and straw hat hint at summer fun. Overlay text reads: "Hello, Weekend." — perfect for a fashion or summer ad.',
      isKnownBrand: false
    },
    {
      id: 5,
      category: 'food',
      title: 'YETI Tumbler',
      description: 'Placed the popular insulated tumbler in an outdoor adventure setting that highlights its durability and lifestyle appeal.',
      before: '/examples/yeti-before.avif',
      after: '/examples/yeti-after.png',
      prompt: 'Put this product on rocky outcrop with mountain vista background, morning campfire nearby, adventure lifestyle, rugged outdoor setting with sunrise light',
      isKnownBrand: true,
      brandName: 'YETI'
    },
    {
      id: 6,
      category: 'food',
      title: 'San Pellegrino Sparkling Water',
      description: 'Transformed a basic product image into a refreshing lifestyle scene perfect for social posts or beverage marketing.',
      before: '/examples/water-before.png',
      after: '/examples/water-after.png',
      prompt: 'A chilled bottle of San Pellegrino sparkling water on a café-style table with a glass of ice and lemon slice, blurred outdoor background, soft sunlight, vibrant and refreshing lifestyle ad.',
      isKnownBrand: true,
      brandName: 'San Pellegrino'
    },
    
    {
      id: 7,
      category: 'electronics',
      title: 'Wooden Bluetooth Speaker',
      description: 'Designed a polished lifestyle ad-style image perfect for social media and product marketing — blending minimalism with powerful messaging.',
      before: '/examples/speaker-before.png',
      after: '/examples/speaker-after.png',
      prompt: 'A sleek wooden Bluetooth speaker set on a minimalist shelf with sunlight casting dramatic shadows across the wall. Above the speaker, bold text overlay reads: "Big Sound. Small Space." Nearby, a phone shows a playlist on screen. Modern apartment setting, clean aesthetic, perfect for a Facebook ad or product post.',
      isKnownBrand: false
    },
    {
      id: 8,
      category: 'gifts',
      title: 'Artisan Bath Gift Set',
      description: 'Created a luxurious lifestyle scene that highlights this elegant bath set as the perfect self-care or gift option.',
      before: '/examples/bathsetbefore.png',
      after: '/examples/bathset-after.png',
      prompt: 'The bath set displayed beside a bathtub on a wooden tray with soft towels, candles, and eucalyptus nearby. Warm, relaxing lighting in a spa-inspired setting — perfect for a self-care or gift ad.',
      isKnownBrand: false
    },
    
  ];

  // Filter examples based on selected category
  const filteredExamples = activeCategory === 'all' 
    ? examples 
    : examples.filter(example => example.category === activeCategory);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-charcoal dark:text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            See What <span className="text-pastel-blue">PostoraAI</span> Can Do
          </h1>
          <p className="text-xl text-charcoal/70 dark:text-gray-300 max-w-2xl mx-auto">
            From everyday products to premium brands, transform any image into professional marketing visuals
          </p>
        </div>

        {/* Legal Disclaimer - Added for brand usage */}
        <div className="mb-8 bg-background rounded-lg border border-light-gray/30 dark:border-border p-4 text-sm text-charcoal/60 dark:text-gray-400 max-w-3xl mx-auto">
          <p className="text-center">
            Example images show both generic and brand-name products for demonstration purposes only. 
            PostoraAI is not affiliated with or endorsed by the brands shown.
            All transformations are AI-generated examples of the platform's capabilities.
          </p>
        </div>

        {/* Category tabs - Improved to fix overflow issues */}
        <div className="mb-12 flex justify-center">
          <Tabs 
            value={activeCategory} 
            onValueChange={setActiveCategory}
            className="w-full max-w-4xl overflow-x-auto pb-2"
          >
            <TabsList className="flex flex-nowrap justify-start md:justify-center gap-2 bg-transparent p-1 min-w-max">
              {categories.map(category => (
                <TabsTrigger 
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: activeCategory === category.id ? 'var(--pastel-blue, #7BDFF2)' : 'transparent',
                    color: activeCategory === category.id ? 'var(--charcoal, #2A2E35)' : 'inherit',
                  }}
                >
                  {category.icon}
                  <span>{category.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Examples grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredExamples.map(example => (
            <motion.div 
              key={example.id}
              className="bg-background rounded-xl overflow-hidden border border-light-gray/30 dark:border-border shadow-sm hover:shadow-md transition-shadow"
              variants={itemVariants}
            >
              <div className="grid grid-cols-2 gap-0">
                {/* Before Image */}
                <div className="relative">
                  <div className="absolute top-2 left-2 bg-white/80 dark:bg-[#23262F]/80 text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm z-10">
                    Before
                  </div>
                  <div className="h-64 bg-light-gray/20 dark:bg-[#1F222A] overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center">
                      <img 
                        src={example.before} 
                        alt={`${example.title} - Before`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
                
                {/* After Image */}
                <div className="relative">
                  <div className="absolute top-2 right-2 bg-pastel-blue/80 text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm z-10">
                    After
                  </div>
                  <div className="h-64 bg-light-gray/20 dark:bg-[#1F222A] overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center">
                      <img 
                        src={example.after} 
                        alt={`${example.title} - After`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Example details */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  {example.title}
                  {example.isKnownBrand && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-light-gray/20 dark:bg-[#23262F] rounded-full text-charcoal/60 dark:text-gray-400">
                      {example.brandName}
                    </span>
                  )}
                </h3>
                <p className="text-charcoal/70 dark:text-gray-300 mb-4">{example.description}</p>
                
                {/* Prompt used */}
                <div className="bg-light-gray/10 dark:bg-[#23262F] rounded-md p-3 mt-4">
                  <div className="flex items-center mb-1">
                    <Sparkles className="h-4 w-4 text-pastel-blue mr-1" />
                    <span className="text-xs font-medium text-pastel-blue">Prompt Used</span>
                  </div>
                  <p className="text-sm text-charcoal/80 dark:text-gray-300 italic">
                    "{example.prompt}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to action */}
        <div className="max-w-3xl mx-auto bg-primary-gradient dark:bg-[#23262F] rounded-xl p-8 text-center border border-pastel-blue/20">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to transform your product photos?</h2>
          <p className="text-charcoal/80 dark:text-gray-300 mb-6 max-w-lg mx-auto">
            Start creating professional marketing visuals in minutes — no design skills required.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="/signup"
              className="bg-white dark:bg-pastel-blue text-charcoal dark:text-[#181A20] font-bold text-base py-3 px-6 rounded-full shadow-md inline-flex items-center"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              <span>Try For Free</span>
            </a>
            <a 
              href="/create"
              className="bg-pastel-blue text-charcoal font-bold text-base py-3 px-6 rounded-full shadow-md inline-flex items-center"
            >
              <span>Start Creating</span>
            </a>
          </div>
        </div>

        {/* Enhanced legal disclaimer */}
        <div className="text-center mt-12 text-sm text-charcoal/50 dark:text-gray-500 max-w-3xl mx-auto">
          <p className="mb-2">* Example images are for demonstration purposes only. Results may vary based on input image quality and prompt.</p>
          <p>All product names, logos, and brands shown are property of their respective owners and are used here for identification purposes only. Use of these names, logos, and brands does not imply endorsement.</p>
        </div>
      </div>
    </div>
  );
};

export default ExamplesPage;