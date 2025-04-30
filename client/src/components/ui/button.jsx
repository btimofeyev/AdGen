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
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-blue focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variantStyles = {
    default: "bg-pastel-blue text-charcoal hover:bg-pastel-blue/80 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/80",
    destructive: "bg-pastel-pink text-charcoal hover:bg-pastel-pink/80 dark:bg-accent dark:text-accent-foreground dark:hover:bg-accent/80",
    outline: "border border-border text-foreground hover:bg-background/80 dark:hover:bg-background/60",
    secondary: "bg-soft-lavender text-charcoal hover:bg-soft-lavender/80 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80",
    ghost: "hover:bg-background/80 dark:hover:bg-background/60",
    link: "text-pastel-blue underline-offset-4 hover:underline dark:text-primary dark:hover:underline"
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