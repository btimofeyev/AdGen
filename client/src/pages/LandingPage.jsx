// SceneSnapAI Landing Page (Final Color Polish - Key Word Highlights)

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const carouselPairs = [
    { before: '/ads/before.webp', after: '/ads/ad1.png' },
    { before: '/ads/before2.jpg', after: '/ads/ad2.png' },
    { before: '/ads/before3.avif', after: '/ads/ad3.png' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselPairs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [carouselPairs.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-foreground overflow-hidden">

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border px-6 py-4 flex justify-between items-center"
      >
        <div className="flex items-center">
          <img src="/assets/logo2.png" alt="SceneSnapAI" className="h-16 w-auto" />
        </div>
        <motion.button
          onClick={() => navigate('/create')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-indigo-600 hover:bg-pink-500 text-white font-bold rounded-full px-6 py-3 shadow-lg transition"
        >
          Get Started
        </motion.button>
      </motion.header>

      {/* Hero Section with Before/After Carousel */}
      <section className="flex flex-col items-center justify-center max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-extrabold mb-4">
            <span className="text-indigo-600">Transform</span> Your Product Photos <span className="text-pink-500">Instantly</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload, Pick a Scene, and Download Stunning Visuals — Ready for Your Storefront, Ads, and Social Media.
          </p>
        </motion.div>

        <motion.div style={{ y: heroImageY }} className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {['before', 'after'].map((type, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-xl">
              <p className="text-center text-sm mb-2 text-gray-500 font-semibold">{type === 'before' ? 'Before' : 'After'}</p>
              <div className="relative w-full h-full overflow-hidden rounded-lg">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={carouselPairs[currentIndex][type]}
                    src={carouselPairs[currentIndex][type]}
                    alt={`${type} shot`}
                    className="w-full h-auto object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                  />
                </AnimatePresence>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold mb-8">
            Why <span className="text-pink-500">SceneSnapAI</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="p-8 bg-gradient-to-br from-white to-gray-100 rounded-2xl shadow-xl hover:shadow-2xl transition">
                <div className="text-5xl text-indigo-600 mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 to-pink-500 text-white text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Sell Smarter. Create Faster. Look Better.</h2>
        <p className="text-lg mb-10">Don't let bad photos cost you sales. Boost your store’s success in minutes.</p>
        <motion.button
          onClick={() => navigate('/create')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-6 bg-white text-indigo-600 font-extrabold text-lg rounded-full px-10 py-5 shadow-xl hover:bg-gray-100 transition-all"
        >
          Start Free Today
        </motion.button>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm bg-white">
        © 2025 SceneSnapAI. All rights reserved.
      </footer>
    </div>
  );
}

const features = [
  { icon: "📸", title: "Upload Your Product", description: "Use any clear photo — smartphone, studio shot, or simple mockup." },
  { icon: "🎨", title: "Pick a Scene", description: "Select from lifestyle backgrounds, studio lighting, holiday themes, and more." },
  { icon: "✨", title: "Get Scroll-Stopping Visuals", description: "Generate shop-perfect images that drive more clicks and faster sales." },
];

export default LandingPage;
