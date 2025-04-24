import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ThemeSelector = ({ themes, selected, onSelect }) => {
  return (
    <Select value={selected} onValueChange={onSelect}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a theme" />
      </SelectTrigger>
      <SelectContent>
        {themes.map((theme, index) => (
          <SelectItem key={index} value={theme}>
            {theme}
          </SelectItem>
        ))}
        <SelectItem value="custom">Custom theme...</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default ThemeSelector;