import * as React from "react";
import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef(({ className, value, onValueChange, ...props }, ref) => {
  const [selectedValue, setSelectedValue] = React.useState(value || "");

  React.useEffect(() => {
    setSelectedValue(value || "");
  }, [value]);

  const handleValueChange = (newValue) => {
    setSelectedValue(newValue);
    if (onValueChange) onValueChange(newValue);
  };

  return (
    <div
      ref={ref}
      className={cn("grid gap-2", className)}
      {...props}
      role="radiogroup"
    >
      {React.Children.map(props.children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, {
          selectedValue,
          onValueChange: handleValueChange,
        });
      })}
    </div>
  );
});
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef(
  ({ className, selectedValue, onValueChange, value, id, ...props }, ref) => {
    const isSelected = selectedValue === value;

    const handleSelect = () => {
      if (onValueChange) onValueChange(value);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isSelected}
        data-state={isSelected ? "checked" : "unchecked"}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-border text-foreground ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isSelected && "bg-primary text-primary-foreground",
          className
        )}
        onClick={handleSelect}
        id={id}
        {...props}
      >
        {isSelected && (
          <span className="flex h-full w-full items-center justify-center relative after:absolute after:h-1.5 after:w-1.5 after:rounded-full after:bg-current" />
        )}
      </button>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
