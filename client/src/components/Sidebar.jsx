// client/src/components/Sidebar.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Home, User, LogOut, Calendar } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activePage, onLogout }) => {
  const navigate = useNavigate();

  // Define the sidebar icons and their navigation paths
  const sidebarItems = [
    { 
      id: 'create', 
      icon: <ImagePlus size={20} />, 
      onClick: () => navigate('/create'),
      active: activePage === 'create'
    },
    { 
      id: 'social', 
      icon: <Calendar size={20} />, 
      onClick: () => navigate('/social'),
      active: activePage === 'social'
    },
    { 
      id: 'account', 
      icon: <User size={20} />, 
      onClick: () => navigate('/account'),
      active: activePage === 'account'
    },
    { 
      id: 'home', 
      icon: <Home size={20} />, 
      onClick: () => navigate('/'),
      active: activePage === 'home'
    }
  ];

  return (
    <div className="hidden sm:flex w-16 bg-[#23262F] shadow flex-col items-center py-6 space-y-6 border-r border-[#23262F]/60">
      <div className="flex items-center justify-center rounded-full bg-pastel-blue/20 p-2">
        {activePage === 'create' ? (
          <ImagePlus size={20} className="text-pastel-blue" />
        ) : activePage === 'social' ? (
          <Calendar size={20} className="text-pastel-blue" />
        ) : (
          <User size={20} className="text-pastel-blue" />
        )}
      </div>
      
      {sidebarItems.map(item => (
        <SidebarIcon 
          key={item.id}
          icon={item.icon} 
          onClick={item.onClick}
          active={item.active}
        />
      ))}
      
      <div className="mt-auto">
        <SidebarIcon icon={<LogOut size={20} />} onClick={onLogout} />
      </div>
    </div>
  );
};

const SidebarIcon = ({ icon, onClick, active }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1, backgroundColor: "rgba(123, 223, 242, 0.1)" }}
      whileTap={{ scale: 0.9 }}
      className={`text-charcoal/70 hover:text-pastel-blue hover:bg-pastel-blue/10 p-3 rounded-xl transition-all ${
        active ? 'bg-pastel-blue/10 text-pastel-blue' : ''
      }`}
      onClick={onClick}
    >
      {icon}
    </motion.button>
  );
};

export default Sidebar;