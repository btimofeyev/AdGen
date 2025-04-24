// client/src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Simulating these components that would be imported from your ui folder
const Button = ({ className = "", variant = "default", children, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variantStyles = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-slate-200 hover:bg-slate-100 text-slate-900",
    ghost: "hover:bg-slate-100 text-slate-900",
    glassy: "backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 text-white shadow-lg",
    "glassy-dark": "backdrop-blur-md bg-black/10 border border-black/20 hover:bg-black/20 text-black shadow-lg",
  };
  
  const classes = `${baseStyles} ${variantStyles[variant] || ""} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

const Card = ({ className = "", glassy = false, children, ...props }) => {
  const classes = `rounded-2xl ${glassy ? 'backdrop-blur-md bg-white/10 border border-white/20 shadow-xl' : 'bg-white shadow-lg border border-slate-200'} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

function LandingPage() {
  const [isHovered, setIsHovered] = useState(false);
  const { scrollYProgress } = useScroll();
  const navigate = useNavigate();
  
  // Transform values for parallax effects
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const featureCardsY = useTransform(scrollYProgress, [0, 0.5], [100, 0]);
  const testimonialOpacity = useTransform(scrollYProgress, [0.4, 0.6], [0, 1]);
  
  // Text gradient animation
  const [gradientPosition, setGradientPosition] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPosition((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      {/* Header/Navbar with glass effect */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-white/20 px-4 md:px-8 py-4"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div 
            className="text-2xl font-bold flex items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <svg 
              className="h-8 w-8 text-blue-600 mr-2" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AdRipple
            </span>
            <span className="block text-xs text-slate-500 ml-1 mt-1">One Click. Infinite Ripples.</span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#how-it-works">How It Works</NavLink>
            <NavLink href="#testimonials">Testimonials</NavLink>
            <Button 
              variant="glassy"
              className="px-4 py-2 rounded-full text-sm"
            >
              Get Started
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section with animated gradients */}
      <section className="relative py-20 px-4 md:px-8 lg:px-12 min-h-[90vh] flex items-center bg-white overflow-hidden">
        {/* Animated background gradient and floating elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-10"
            style={{
              transform: `rotate(${gradientPosition}deg)`,
              transition: 'transform 0.5s ease-out'
            }}
          />
          <div className="absolute inset-0 backdrop-blur-[100px]" />
          {/* Floating circles */}
          <FloatingElement size="lg" color="blue" top="10%" left="5%" delay={0} />
          <FloatingElement size="md" color="purple" top="70%" left="15%" delay={0.5} />
          <FloatingElement size="xl" color="pink" top="20%" right="10%" delay={1} />
          <FloatingElement size="sm" color="blue" bottom="15%" right="20%" delay={1.5} />
        </div>
        {/* Split layout content */}
        <div className="max-w-7xl mx-auto w-full z-10 flex flex-col md:flex-row items-center gap-12">
          {/* Left: Headline, subhead, CTA */}
          <div className="md:w-1/2 flex flex-col items-start justify-center mb-12 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              One Click. <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Infinite Ripples.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-700 mb-8 leading-relaxed">
              Instantly turn any product photo into multi-format ads, socials, and email banners—no design skills required.
            </p>
            <Button 
              className="text-base px-8 py-6 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
              onClick={() => navigate('/create')}
            >
              Try it yourself
            </Button>
          </div>
          {/* Right: Before/After Carousel */}
          <div className="md:w-1/2 w-full flex items-center justify-center">
            <HeroBeforeAfterCarousel />
          </div>
        </div>
      </section>

  {/* Features section with staggered cards */}
  <section id="features" className="py-20 px-4 md:px-8 relative">
    <div className="absolute inset-0 -z-10 bg-slate-50"></div>
    
    <motion.div 
      className="max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <motion.h2 
        className="text-3xl md:text-4xl font-bold text-center mb-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Launch Stunning <GradientText>Visuals</GradientText> in Minutes, Not Hours
      </motion.h2>
      
      <motion.p 
        className="text-center text-slate-600 max-w-3xl mx-auto mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Describe your product and let our AI instantly generate on-brand ads, social posts, email headers, product showcases, and more—no design skills required.
      </motion.p>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        style={{ y: featureCardsY }}
      >
        <FeatureCard 
          icon={
            <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          }
          title="Universal Upload"
          description="Simply drop in any image—product shot, logo, even lifestyle photo—and watch us generate a full suite of visual variants."
          index={0}
        />
        <FeatureCard 
          icon={
            <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          }
          title="Multi-Channel Design"
          description="Our AI crafts eye-catching layouts for every platform—Instagram stories, Facebook ads, email headers, website banners, and more."
          index={1}
        />
        <FeatureCard 
          icon={
            <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          }
          title="Finish in Seconds"
          description="Get a downloadable gallery of polished visuals—in under 30 seconds—and deploy them directly to your campaigns."
          index={2}
        />
      </motion.div>
    </motion.div>
  </section>


  {/* Testimonials Section */}
  <section id="testimonials" className="py-24 px-4 md:px-8 bg-white">
    <div className="max-w-7xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
        Proven by Teams Worldwide with <GradientText>AdRipple</GradientText>
      </h2>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-12">
        From startups to enterprises, marketers use AdRipple to instantly generate ads, social posts, email banners, product shots, and more—at unbeatable speed and scale.
      </p>

      {/* Horizontal scroll of business icons */}
      <BusinessIconRow />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <TestimonialCard 
          quote="We created over 50 unique visuals in under an hour—our Instagram engagement soared by 40% thanks to AdRipple."
          author="Sarah Johnson"
          role="Marketing Director, TechCorp"
          index={0}
          light
        />
        <TestimonialCard 
          quote="AdRipple's multi-channel templates boosted our email CTR by 28%, and freed our team from design bottlenecks."
          author="Michael Chen"
          role="E-commerce Lead, StyleHub"
          index={1}
          light
        />
        <TestimonialCard 
          quote="As a small business, we can't afford an in-house design team. AdRipple lets us produce professional product shots, banners, and socials in seconds."
          author="Emma Rodriguez"
          role="Founder & CEO, Artisan Goods Co."
          index={2}
          light
        />
      </div>
    </div>
  </section>

  {/* How It Works Section with numbered steps */}
  <section id="how-it-works" className="py-20 px-4 md:px-8 relative">
    <div className="absolute inset-0 -z-10 bg-white"></div>
    
    <div className="max-w-7xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
        How <GradientText>AdRipple</GradientText> Works
      </h2>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-12">
        In three clicks, transform any image into a full suite of on-brand ads, social posts, email headers, product showcases, and more.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
        {/* Connecting line between process steps */}
        <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300 via-purple-300 to-blue-300" />

        <ProcessCard 
          number="01"
          title="Upload Your Visual"
          description="Drag & drop any photo—product shots, logos or lifestyle images—to kick off the magic."
          index={0}
        />
        <ProcessCard 
          number="02"
          title="Set Your Style"
          description="Enter your messaging, choose themes like 'Flash Sale', and apply brand colors or logos for perfect consistency."
          index={1}
        />
        <ProcessCard 
          number="03"
          title="Generate & Go Live"
          description="Hit Generate and download a gallery of polished assets—ads, social graphics, email banners—ready for immediate use."
          index={2}
        />
      </div>
    </div>
  </section>


      {/* CTA Section with glass effect */}
      <section className="py-20 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFFFFF" d="M40.8,-47.3C52,-33.2,59.4,-16.6,60.1,-0.6C60.8,15.3,54.8,30.7,43.5,41.2C32.3,51.8,16.1,57.5,0.9,56.6C-14.3,55.8,-28.6,48.2,-41.6,37.5C-54.7,26.7,-66.4,13.3,-68,13.3C-69.5,13.3,-60.7,26.7,-49.9,35.8C-39,44.9,-26.4,50.5,-26.4,50.5L-13.2,25.3L0,0" transform="translate(100 100)" />
          </svg>
        </div>
        
        <motion.div 
          className="max-w-4xl mx-auto relative z-10"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <Card 
            glassy={true} 
            className="p-8 md:p-12 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                Ready to Transform Your Product Marketing?
              </h2>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <p className="text-lg md:text-xl text-white/90 mb-8">
                Join thousands of businesses creating stunning advertisements in seconds.
              </p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                className="text-blue-600 bg-white hover:bg-blue-50 text-base px-8 py-6 rounded-full shadow-lg"
              >
                Get Started Now
                <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-8 md:mb-0">
            <h2 className="text-2xl font-bold flex items-center">
              <svg 
                className="h-6 w-6 text-blue-600 mr-2" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AdRipple
              </span>
              <span className="block text-xs text-slate-500 ml-1 mt-1">One Click. Infinite Ripples.</span>
            </h2>
            <p className="text-slate-500 mt-2">Transform images into engaging ads</p>
          </div>
          
          <div className="flex gap-6">
            <FooterLink href="#features">Features</FooterLink>
            <FooterLink href="#how-it-works">How It Works</FooterLink>
            <FooterLink href="#testimonials">Testimonials</FooterLink>
            <FooterLink href="#">Support</FooterLink>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
          © 2025 AdRipple. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// Component for animated floating elements in background
function FloatingElement({ size, color, top, left, right, bottom, delay }) {
  const sizes = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
    xl: "h-48 w-48",
  };
  
  const colors = {
    blue: "bg-blue-400",
    purple: "bg-purple-400",
    pink: "bg-pink-400",
  };
  
  const styles = {
    ...(top && { top }),
    ...(left && { left }),
    ...(right && { right }),
    ...(bottom && { bottom }),
  };
  
  return (
    <motion.div
      className={`absolute rounded-full ${sizes[size]} ${colors[color]} opacity-20 blur-3xl`}
      style={styles}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: [0.8, 1.2, 0.8],
        opacity: [0.1, 0.3, 0.1],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

// Feature card component with animation
function FeatureCard({ icon, title, description, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
    >
      <Card className="h-full p-6 hover:shadow-xl transition-shadow duration-300">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="p-0"
        >
          <div className="mb-4 bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center">
            {icon}
          </div>
          <h3 className="text-xl font-semibold mb-3">{title}</h3>
          <p className="text-slate-600">{description}</p>
        </motion.div>
      </Card>
    </motion.div>
  );
}

// Testimonial card with glass effect
function TestimonialCard({ quote, author, role, index, light }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
    >
      <Card 
        glassy={false} 
        className={`h-full p-8 border border-slate-200 shadow-md transition-shadow duration-300 bg-white ${light ? '' : 'bg-white/10'}`}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 17 }}
          className="p-0"
        >
          <svg className="h-6 w-6 text-blue-400 mb-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16.036-.33.084-.506.144l.882.45c.572.292.853.626.853 1.003 0 .346-.257.666-.771.966-.537.31-1.167.465-1.893.465-.726 0-1.356-.155-1.893-.465C3.26 14.974 3 14.654 3 14.308c0-.207.08-.39.24-.55.142-.142.332-.213.571-.213.298 0 .54.09.724.272.33.33.738.5 1.213.5.889 0 1.58-.172 2.08-.515.52-.356.78-.846.78-1.468 0-.437-.102-.892-.304-1.363-.2-.47-.49-.908-.867-1.314-.39-.42-.855-.746-1.402-.975z"></path>
            <path d="M21.294 3.3l-.707-.707-2.122 2.122-2.121-2.122-.707.707 2.121 2.121-2.121 2.122.707.707 2.121-2.122 2.122 2.122.707-.707-2.122-2.122z"></path>
          </svg>
          <p className="text-slate-800 mb-6 italic">{quote}</p>
          <div>
            <p className="font-semibold text-slate-900">{author}</p>
            <p className="text-sm text-slate-500">{role}</p>
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
}

// Process card with animated step number
function ProcessCard({ number, title, description, index }) {
  return (
    <motion.div 
      className="flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
    >
      <motion.div 
        className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-xl w-14 h-14 rounded-full flex items-center justify-center mb-6 relative z-10"
        whileHover={{ 
          scale: 1.1,
          boxShadow: "0 0 20px rgba(79, 70, 229, 0.5)"
        }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {number}
      </motion.div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </motion.div>
  );
}

// Gradient text component
function GradientText({ children }) {
  return (
    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

// Navigation link component with hover effect
function NavLink({ href, children }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.a 
      href={href}
      className="text-slate-700 hover:text-blue-600 transition-colors relative font-medium"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <motion.div 
        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded"
        initial={{ width: 0, left: "50%" }}
        animate={{ 
          width: isHovered ? "100%" : 0,
          left: isHovered ? "0%" : "50%"
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.a>
  );
}

// Footer link component
function FooterLink({ href, children }) {
  return (
    <motion.a 
      href={href}
      className="text-slate-600 hover:text-blue-600 transition-colors"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {children}
    </motion.a>
  );
}

// Horizontally scrollable row of business icons
function BusinessIconRow() {
  // Example SVGs; replace with real logos as needed
  const icons = [
    (
      <svg key="1" className="h-12 w-24 mx-6" viewBox="0 0 100 40" fill="none">
        <rect x="10" y="10" width="80" height="20" rx="6" fill="#2563eb" />
        <text x="50" y="25" textAnchor="middle" fill="white" fontSize="14" fontFamily="Arial">BlueTech</text>
      </svg>
    ),
    (
      <svg key="2" className="h-12 w-24 mx-6" viewBox="0 0 100 40" fill="none">
        <rect x="10" y="10" width="80" height="20" rx="6" fill="#a21caf" />
        <text x="50" y="25" textAnchor="middle" fill="white" fontSize="14" fontFamily="Arial">PurpleSoft</text>
      </svg>
    ),
    (
      <svg key="3" className="h-12 w-24 mx-6" viewBox="0 0 100 40" fill="none">
        <rect x="10" y="10" width="80" height="20" rx="6" fill="#f59e42" />
        <text x="50" y="25" textAnchor="middle" fill="white" fontSize="14" fontFamily="Arial">OrangeCo</text>
      </svg>
    ),
    (
      <svg key="4" className="h-12 w-24 mx-6" viewBox="0 0 100 40" fill="none">
        <rect x="10" y="10" width="80" height="20" rx="6" fill="#059669" />
        <text x="50" y="25" textAnchor="middle" fill="white" fontSize="14" fontFamily="Arial">Greenify</text>
      </svg>
    ),
    (
      <svg key="5" className="h-12 w-24 mx-6" viewBox="0 0 100 40" fill="none">
        <rect x="10" y="10" width="80" height="20" rx="6" fill="#64748b" />
        <text x="50" y="25" textAnchor="middle" fill="white" fontSize="14" fontFamily="Arial">SlateSys</text>
      </svg>
    ),
    (
      <svg key="6" className="h-12 w-24 mx-6" viewBox="0 0 100 40" fill="none">
        <rect x="10" y="10" width="80" height="20" rx="6" fill="#e11d48" />
        <text x="50" y="25" textAnchor="middle" fill="white" fontSize="14" fontFamily="Arial">RedLabs</text>
      </svg>
    ),
  ];

  return (
    <div className="w-full overflow-x-auto py-4 mb-10">
      <div className="flex items-center justify-start min-w-[600px] md:min-w-[900px] lg:min-w-[1100px]">
        {icons}
      </div>
    </div>
  );
}

// Add this new component at the end of the file before export default LandingPage
function HeroBeforeAfterCarousel() {
  // Example images (replace with real ones as needed)
  const pairs = [
    { before: '/ads/before.webp', after: '/ads/ad1.png' },
    { before: '/ads/before2.jpg', after: '/ads/ad2.png' },
    { before: '/ads/before3.avif', after: '/ads/ad3.png' },
    { before: '/ads/before4.webp', after: '/ads/ad4.png' },
  ];
  const [index, setIndex] = useState(0);
  const [showAfter, setShowAfter] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % pairs.length);
      setShowAfter(true); // Always show 'after' first on slide change
    }, 3500);
    return () => clearInterval(interval);
  }, [pairs.length]);

  const { before, after } = pairs[index];

  return (
    <div className="relative w-full max-w-[400px] h-[350px] md:h-[420px] bg-slate-100 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
      <img
        src={showAfter ? after : before}
        alt={showAfter ? 'Generated' : 'Original'}
        className="w-full h-full object-contain bg-white transition-all duration-700"
        style={{ maxHeight: '100%', maxWidth: '100%' }}
      />
      <button
        className="absolute top-4 right-4 bg-white/90 text-xs px-3 py-1 rounded-full shadow border border-slate-200 hover:bg-blue-50 transition"
        onClick={() => setShowAfter((v) => !v)}
        aria-label="Toggle before/after"
        type="button"
      >
        {showAfter ? 'Show Before' : 'Show After'}
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {pairs.map((_, i) => (
          <span
            key={i}
            className={`block w-2 h-2 rounded-full ${i === index ? 'bg-blue-600' : 'bg-white/70 border border-blue-300'} transition-all`}
          />
        ))}
      </div>
      <div className="absolute bottom-4 right-4 bg-white/80 text-xs px-3 py-1 rounded-full shadow">
        Live Demo
      </div>
    </div>
  );
}

export default LandingPage;