// client/src/components/CustomRadioGroup.jsx
import * as React from "react";

const RadioGroup = ({ children, className = "", value, onValueChange, ...props }) => {
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
      className={`grid gap-2 ${className}`}
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
};

const RadioGroupItem = ({ 
  className = "", 
  selectedValue, 
  onValueChange, 
  value, 
  id, 
  children,
  ...props 
}) => {
  const isSelected = selectedValue === value;

  const handleSelect = () => {
    if (onValueChange) onValueChange(value);
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      data-state={isSelected ? "checked" : "unchecked"}
      className={`aspect-square h-4 w-4 rounded-full border border-blue-600 text-blue-600 ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        isSelected ? "bg-blue-600 text-white" : ""
      } ${className}`}
      onClick={handleSelect}
      id={id}
      {...props}
    >
      {isSelected && (
        <span className="flex h-full w-full items-center justify-center relative after:absolute after:h-1.5 after:w-1.5 after:rounded-full after:bg-current" />
      )}
      {children}
    </button>
  );
};

export { RadioGroup, RadioGroupItem };