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

  // Example showcases - updated with well-known products
  const examples = [
    {
      id: 1,
      category: 'electronics',
      title: 'Apple AirPods',
      description: 'Transformed a standard product shot into a lifestyle image showing the AirPods in a premium, active context.',
      before: '/examples/airpods-before.jpg',
      after: '/examples/airpods-after.png',
      prompt: 'Apple AirPods on a modern desk with MacBook, coffee cup, and stylish notebook, soft window lighting, premium lifestyle setting',
      isKnownBrand: true,
      brandName: 'Apple'
    },
    {
      id: 2,
      category: 'electronics',
      title: 'Sony Wireless Headphones',
      description: 'Enhanced the product visualization by placing it in a music studio environment that appeals to audio enthusiasts.',
      before: '/examples/headphones-before.jpg',
      after: '/examples/headphones-after.jpg',
      prompt: 'Sony wireless headphones in a professional music studio with instruments, mixing console, and ambient lighting, audio professional environment',
      isKnownBrand: true,
      brandName: 'Sony'
    },
    {
      id: 3,
      category: 'fashion',
      title: 'Nike Running Shoes',
      description: 'Transformed a basic product photo into an action-oriented scene that showcases the shoes in their intended environment.',
      before: '/examples/nike-shoes-before.jpg',
      after: '/examples/nike-shoes-after.jpg',
      prompt: 'Nike running shoes on an outdoor trail with morning light, dynamic angle, athletic lifestyle, action-oriented product shot',
      isKnownBrand: true,
      brandName: 'Nike'
    },
    {
      id: 4,
      category: 'fashion',
      title: 'Handcrafted Leather Wallet',
      description: 'Elevated a simple product photo to showcase craftsmanship and quality in a premium context.',
      before: '/examples/wallet-before.jpg',
      after: '/examples/wallet-after.jpg',
      prompt: 'Artisan leather wallet on dark wooden surface with watch and minimal accessories, warm lighting, luxury menswear aesthetic',
      isKnownBrand: false
    },
    {
      id: 5,
      category: 'food',
      title: 'Starbucks Coffee',
      description: 'Created a cozy, inviting scene that evokes the coffee shop experience right from a packaged product.',
      before: '/examples/starbucks-before.jpg',
      after: '/examples/starbucks-after.jpg',
      prompt: 'Starbucks coffee bag with freshly brewed coffee in cup nearby, coffee beans scattered, wooden table, warm morning light, coffee shop atmosphere',
      isKnownBrand: true,
      brandName: 'Starbucks'
    },
    {
      id: 6,
      category: 'food',
      title: 'Artisanal Olive Oil',
      description: 'Transformed a standalone product into a Mediterranean culinary scene that tells a story about heritage and quality.',
      before: '/examples/olive-oil-before.jpg',
      after: '/examples/olive-oil-after.jpg',
      prompt: 'Bottle of premium olive oil with fresh bread, tomatoes, and herbs on rustic wooden table, Mediterranean setting, golden afternoon light',
      isKnownBrand: false
    },
    {
      id: 7,
      category: 'homegoods',
      title: 'IKEA POÄNG Chair',
      description: 'Placed the iconic chair in a complete living room setup to help shoppers visualize it in their own homes.',
      before: '/examples/ikea-chair-before.jpg',
      after: '/examples/ikea-chair-after.jpg',
      prompt: 'IKEA POÄNG chair in a Scandinavian living room with natural light, houseplants, bookshelf, and modern decor elements',
      isKnownBrand: true,
      brandName: 'IKEA'
    },
    {
      id: 8,
      category: 'homegoods',
      title: 'Ceramic Plant Pot Collection',
      description: 'Transformed basic product shots into a styled indoor garden scene that inspires home decorators.',
      before: '/examples/plant-pots-before.jpg',
      after: '/examples/plant-pots-after.jpg',
      prompt: 'Collection of modern ceramic plant pots with various succulents and indoor plants, arranged on wooden shelving, bohemian interior design',
      isKnownBrand: false
    },
    {
      id: 9,
      category: 'gifts',
      title: 'Lush Bath Bombs',
      description: 'Created a spa-like setting that elevates these colorful products and suggests self-care and relaxation.',
      before: '/examples/lush-before.jpg',
      after: '/examples/lush-after.jpg',
      prompt: 'Lush bath bombs arranged near a luxurious bathtub with candles, towels, and eucalyptus sprigs, spa atmosphere, soft mood lighting',
      isKnownBrand: true,
      brandName: 'Lush'
    },
    {
      id: 10,
      category: 'gifts',
      title: 'Handmade Scented Candles',
      description: 'Created a seasonal setting that positions these candles as perfect gifts for any occasion.',
      before: '/examples/candles-before.jpg',
      after: '/examples/candles-after.jpg',
      prompt: 'Artisanal scented candles arranged with seasonal decorations and gift wrapping elements, warm glowing light, cozy atmosphere',
      isKnownBrand: false
    }
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