// client/src/components/ThemeSelector.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, ChevronDown, Sparkles } from "lucide-react";

// Custom Select components that don't rely on external imports
const Select = ({ children, value, onValueChange, ...props }) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");

  React.useEffect(() => {
    setSelectedValue(value || "");
  }, [value]);

  const handleSelect = (newValue) => {
    setSelectedValue(newValue);
    if (onValueChange) onValueChange(newValue);
    setOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (open && !e.target.closest('[data-select-container]')) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div 
      data-select-container
      className="relative w-full" 
      {...props}
    >
      <SelectTrigger 
        onClick={() => setOpen(!open)} 
        className="flex items-center justify-between w-full bg-white/80 backdrop-blur-sm border border-blue-100 focus:border-blue-300 shadow-sm hover:bg-blue-50/50 transition-colors h-10 rounded-md px-3 py-2 text-sm"
      >
        <SelectValue placeholder="Select a theme">
          {selectedValue ? (
            <div className="flex items-center">
              <span className="mr-2">{getThemeIcon(selectedValue)}</span>
              {selectedValue}
            </div>
          ) : (
            <div className="flex items-center text-slate-500">
              <Sparkles className="h-4 w-4 mr-2" />
              Select a theme
            </div>
          )}
        </SelectValue>
        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </SelectTrigger>
      
      {open && (
        <SelectContent 
          onSelect={() => {}}
          selectedValue={selectedValue}
          onValueChange={handleSelect}
        >
          {props.children}
        </SelectContent>
      )}
    </div>
  );
};

const SelectTrigger = ({ children, className, ...props }) => (
  <button
    type="button"
    className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const SelectValue = ({ children, placeholder, ...props }) => (
  <span
    className="flex-grow text-left truncate"
    {...props}
  >
    {children || placeholder}
  </span>
);

const SelectContent = ({ children, className, onValueChange, selectedValue, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 5 }}
    transition={{ duration: 0.15 }}
    className={`absolute z-50 min-w-[8rem] w-full overflow-hidden rounded-md border bg-white/95 backdrop-blur-sm border-blue-100 shadow-lg mt-1 ${className}`}
    {...props}
  >
    <div className="max-h-[300px] overflow-auto py-1">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, {
          onSelect: () => onValueChange(child.props.value),
          isSelected: child.props.value === selectedValue,
        });
      })}
    </div>
  </motion.div>
);

const SelectItem = ({ children, className, onSelect, isSelected, value, ...props }) => (
  <div
    className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-3 text-sm outline-none hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : ''} ${className}`}
    onClick={onSelect}
    {...props}
  >
    <span className="flex-grow truncate">{children}</span>
    {isSelected && <CheckIcon className="h-4 w-4 ml-2 text-blue-600" />}
  </div>
);

// Helper function to get theme icon
const getThemeIcon = (theme) => {
  if (!theme) return '🎯';
  if (theme.toLowerCase().includes('sale')) {
    return '🏷️';
  } else if (theme.toLowerCase().includes('holiday')) {
    return '🎁';
  } else if (theme.toLowerCase().includes('summer')) {
    return '☀️';
  } else if (theme.toLowerCase().includes('school')) {
    return '📚';
  } else if (theme.toLowerCase().includes('father')) {
    return '👔';
  } else if (theme.toLowerCase().includes('limited')) {
    return '⭐';
  } else if (theme.toLowerCase().includes('new')) {
    return '✨';
  } else if (theme === 'custom') {
    return '🎨';
  } else {
    return '🎯';
  }
};

// Main ThemeSelector component
const ThemeSelector = ({ themes, selected, onSelect }) => {
  // Animation variants for the selection component
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.05,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Select value={selected} onValueChange={onSelect}>
        <motion.div variants={containerVariants}>
          {themes.map((theme, index) => (
            <motion.div 
              key={index} 
              variants={itemVariants}
              custom={index}
            >
              <SelectItem 
                value={theme}
                className="hover:bg-blue-50 focus:bg-blue-50 rounded my-1 cursor-pointer flex items-center"
              >
                <span className="mr-2">{getThemeIcon(theme)}</span>
                {theme}
              </SelectItem>
            </motion.div>
          ))}
          <motion.div variants={itemVariants}>
            <SelectItem 
              value="custom" 
              className="hover:bg-blue-50 focus:bg-blue-50 rounded my-1 cursor-pointer flex items-center border-t border-blue-100 mt-2 pt-2"
            >
              <span className="mr-2">🎨</span>
              Custom theme...
            </SelectItem>
          </motion.div>
        </motion.div>
      </Select>
    </motion.div>
  );
};

export default ThemeSelector;