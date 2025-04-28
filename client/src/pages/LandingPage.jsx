// client/src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Clock, Layout, Palette } from "lucide-react";

const MotionLink = motion(Link);

function LandingPage() {
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
    <div className="min-h-screen bg-soft-white text-charcoal overflow-hidden">
      {/* Removed Navbar component from here */}

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center max-w-7xl mx-auto px-6 py-20 text-center">
         <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-extrabold mb-4">
            <span className="text-pastel-blue">Transform</span> Your Product Photos <span className="text-pastel-pink">Instantly</span>
          </h1>
          <p className="text-xl text-charcoal/80 max-w-2xl mx-auto">
            Upload, Pick a Scene, and Download Stunning Visuals — Ready for Your Storefront, Ads, and Social Media.
          </p>
        </motion.div>
          <motion.div style={{ y: heroImageY }} className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {['before', 'after'].map((type, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-xl border border-light-gray/40">
              <p className="text-center text-sm mb-2 text-charcoal/60 font-semibold">{type === 'before' ? 'Before' : 'After'}</p>
              <div className="relative w-full h-64 overflow-hidden rounded-lg bg-soft-white">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={carouselPairs[currentIndex][type]}
                    src={carouselPairs[currentIndex][type]}
                    alt={`${type} shot`}
                    className="w-full h-full object-contain"
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

      {/* How It Works Section */}
       <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-16 text-charcoal relative">
            How SnapSceneAI Works
            <div className="absolute w-24 h-1 bg-pastel-blue bottom-0 left-1/2 transform -translate-x-1/2 -mb-4"></div>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "📸",
                title: "Upload Your Product",
                description: "Use any clear photo — smartphone images, studio shots, or simple mockups."
              },
              {
                icon: "🎨",
                title: "Pick a Scene",
                description: "Select from lifestyle backgrounds, studio lighting, holiday themes, and more."
              },
              {
                icon: "✨",
                title: "Get Amazing Visuals",
                description: "Generate shop-perfect images that drive more clicks and faster sales."
              }
            ].map((step, idx) => (
              <div key={idx} className="bg-soft-white rounded-xl p-6 shadow-sm border border-light-gray/40 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-charcoal">{step.title}</h3>
                <p className="text-charcoal/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
       <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-charcoal">Why Choose SnapSceneAI?</h2>
            <p className="text-charcoal/70 max-w-2xl mx-auto">
              Our platform makes professional ad creation accessible to everyone, regardless of design skills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: <Sparkles className="h-6 w-6 text-pastel-blue" />,
                title: "Professional Quality",
                description: "Generate studio-quality visuals that make your products shine and convert better."
              },
              {
                icon: <Clock className="h-6 w-6 text-soft-lavender" />,
                title: "Time Saving",
                description: "Create in minutes what would take hours with traditional design tools."
              },
              {
                icon: <Layout className="h-6 w-6 text-pastel-pink" />,
                title: "Multiple Formats",
                description: "Create ads optimized for different platforms - Instagram, Facebook, email, and more."
              },
              {
                icon: <Palette className="h-6 w-6 text-pastel-blue" />,
                title: "No Design Skills Needed",
                description: "Our AI handles the design work. You just pick a theme and download."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-soft-white p-6 rounded-xl border border-light-gray/40 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div className="mr-4 mt-1 p-2 bg-white rounded-lg shadow-sm">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-charcoal">{feature.title}</h3>
                    <p className="text-charcoal/70">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-primary-gradient text-charcoal text-center">
         <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Sell Smarter. Create Faster. Look Better.</h2>
          <p className="text-lg mb-10 text-charcoal/80">Don't let bad photos cost you sales. Boost your store's success in minutes.</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mt-6">
            <MotionLink
              to="/signup"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-charcoal font-extrabold text-lg rounded-full px-10 py-5 shadow-xl hover:bg-white/90 transition-all"
            >
              Start Free Today
            </MotionLink>
            <MotionLink
              to="/login"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-pastel-blue text-charcoal font-extrabold text-lg rounded-full px-10 py-5 shadow-xl hover:bg-pastel-blue/80 transition-all border border-pastel-blue"
            >
              Log In
            </MotionLink>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-8 border-t border-light-gray/40 bg-white">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-8 md:mb-0">
            <h2 className="text-2xl font-bold flex items-center">
              <Sparkles className="h-6 w-6 text-pastel-blue mr-2" />
              SnapSceneAI
            </h2>
            <p className="text-charcoal/60 mt-2">Transform images into engaging visuals</p>
          </div>

          <div className="flex gap-6">
            {["Features", "Pricing", "Examples", "Support"].map((item, idx) => (
              <a key={idx} href={`/${item.toLowerCase()}`} className="text-charcoal/70 hover:text-pastel-blue transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-light-gray/40 text-center text-charcoal/50 text-sm">
          © 2025 SnapSceneAI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;