import React from "react";

export function Button({ 
  children, 
  className = "", 
  variant = "default", 
  size = "default", 
  disabled = false,
  type = "button",
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variantStyles = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-slate-200 hover:bg-slate-100",
    secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300",
    ghost: "hover:bg-slate-100",
    link: "text-blue-600 underline-offset-4 hover:underline"
  };
  
  const sizeStyles = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3",
    lg: "h-11 px-8"
  };
  
  const classes = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className
  ].join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}