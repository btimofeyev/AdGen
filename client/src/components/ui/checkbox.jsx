import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(checked || false);

  React.useEffect(() => {
    setIsChecked(checked || false);
  }, [checked]);

  const handleChange = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    if (onCheckedChange) onCheckedChange(newValue);
  };

  return (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={isChecked}
      data-state={isChecked ? "checked" : "unchecked"}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        isChecked && "bg-primary text-primary-foreground",
        className
      )}
      onClick={handleChange}
      {...props}
    >
      {isChecked && (
        <CheckIcon className="h-3 w-3 text-current" />
      )}
    </button>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };