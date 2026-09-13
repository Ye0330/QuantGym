"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function AnswerChoices({ choices, value, onChange, onSubmit, active = true, disabled = false, label = "Choose an answer", submitLabel = "Check answer" }: {
  choices: string[]; value: string; onChange: (value: string) => void; onSubmit: () => void; active?: boolean; disabled?: boolean; label?: string; submitLabel?: string;
}) {
  const firstRef = useRef<HTMLButtonElement>(null);
  const identity = choices.join("|");
  useEffect(() => { if (active && !disabled) firstRef.current?.focus(); }, [identity, active, disabled]);
  return <form className="choice-form" onSubmit={event => { event.preventDefault(); if (!disabled && choices.includes(value)) onSubmit(); }} onKeyDown={event => {
    if (disabled || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.repeat) { if (event.key === "Enter") event.preventDefault(); return; }
    const index = "abcd".indexOf(event.key.toLowerCase());
    if (event.key.length === 1 && index >= 0) { event.preventDefault(); onChange(choices[index]); }
    if (event.key === "Enter") { event.preventDefault(); if (choices.includes(value)) onSubmit(); }
  }}>
    <RadioGroup className="answer-choices" aria-label={label} value={value} onValueChange={onChange} disabled={disabled}>
      {choices.map((choice, index) => <label className={`answer-choice ${value === choice ? "selected" : ""}`} key={choice}><RadioGroupItem value={choice} ref={index === 0 ? firstRef : undefined} aria-label={`${"ABCD"[index]}. ${choice}`} /><span className="choice-letter">{"ABCD"[index]}</span><strong>{choice}</strong></label>)}
    </RadioGroup>
    <button className="primary-button" type="submit" disabled={disabled || !choices.includes(value)}>{submitLabel}<Check /></button>
  </form>;
}
