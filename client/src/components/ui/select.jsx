import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDown } from "lucide-react";

const Select = React.forwardRef(({ children, value, onValueChange, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value || "");

  React.useEffect(() => {
    setSelectedValue(value || "");
  }, [value]);

  const handleSelect = (value) => {
    setSelectedValue(value);
    if (onValueChange) onValueChange(value);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full" {...props}>
      <SelectTrigger 
        onClick={() => setOpen(!open)} 
        className={cn(
          "flex items-center justify-between w-full",
          props.className
        )}
      >
        {React.Children.toArray(children).find(
          (child) => React.isValidElement(child) && child.type === SelectValue
        )}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectTrigger>
      {open && (
        <SelectContent onSelect={(e) => e.preventDefault()}>
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child) || child.type !== SelectContent) {
              return null;
            }
            return React.cloneElement(child, {
              onValueChange: handleSelect,
              selectedValue,
            });
          })}
        </SelectContent>
      )}
    </div>
  );
});
Select.displayName = "Select";

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </button>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = React.forwardRef(({ className, placeholder, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("flex-grow text-left truncate text-foreground", className)}
    {...props}
  >
    {props.children || placeholder}
  </span>
));
SelectValue.displayName = "SelectValue";

const SelectContent = React.forwardRef(
  ({ className, children, onValueChange, selectedValue, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] w-full overflow-hidden rounded-md border border-border bg-background text-foreground shadow-md animate-in fade-in-80 mt-1",
        className
      )}
      {...props}
    >
      <div className="max-h-[--radix-select-content-available-height] overflow-auto">
        <div className="flex flex-col py-1.5">
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child) || child.type !== SelectItem) {
              return null;
            }
            return React.cloneElement(child, {
              onSelect: () => onValueChange(child.props.value),
              isSelected: child.props.value === selectedValue,
            });
          })}
        </div>
      </div>
    </div>
  )
);
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef(
  ({ className, children, onSelect, isSelected, value, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
      onClick={onSelect}
      {...props}
    >
      <span className="flex-grow truncate">{children}</span>
      {isSelected && <CheckIcon className="h-4 w-4 ml-2" />}
    </div>
  )
);
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
};