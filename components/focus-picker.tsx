"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CATEGORIES, LABELS, focusCategories, focusLabel, toggleFocus, type Focus } from "@/lib/quant-engine";

export function FocusPicker({ value, onChange }: { value: Focus; onChange: (value: Focus) => void }) {
  const [open, setOpen] = useState(false);
  const selected = value === "mixed" ? [] : focusCategories(value);
  return <div className="focus-picker">
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><button className="focus-select focus-trigger" aria-labelledby="focus-label focus-value" title={focusLabel(value)}><span id="focus-value">{focusLabel(value, true)}</span><ChevronDown size={16} /></button></PopoverTrigger>
      <PopoverContent className="focus-options" align="start" collisionPadding={16}>
        <fieldset><legend className="focus-legend">Choose your skills</legend>
          <label className={`focus-option mixed-option ${value === "mixed" ? "selected" : ""}`}><Checkbox checked={value === "mixed"} onCheckedChange={() => onChange(toggleFocus(value, "mixed"))} /><span><strong>Mixed practice</strong><small>All skills · clears individual selections</small></span></label>
          <div className="focus-option-list">{CATEGORIES.map(category => <label key={category} className={`focus-option ${selected.includes(category) ? "selected" : ""}`}><Checkbox checked={selected.includes(category)} onCheckedChange={() => onChange(toggleFocus(value, category))} /><span>{LABELS[category]}</span></label>)}</div>
        </fieldset>
        <div className="focus-options-footer"><span>No individual skills selected? Mixed is used.</span><button className="secondary-button" onClick={() => setOpen(false)}>Done</button></div>
      </PopoverContent>
    </Popover>
    {selected.length > 1 && <div className="focus-selection" aria-live="polite">{selected.map(category => <span key={category}>{LABELS[category]}</span>)}</div>}
  </div>;
}
