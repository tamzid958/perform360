"use client";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Star, Type, List } from "lucide-react";

const QUESTION_TYPES = [
  { value: "rating_scale", label: "Rating Scale", icon: Star },
  { value: "text", label: "Text Response", icon: Type },
  { value: "multiple_choice", label: "Multiple Choice", icon: List },
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number]["value"];

interface QuestionTypeSelectorProps {
  value: QuestionType;
  onChange: (value: QuestionType) => void;
  className?: string;
}

export function QuestionTypeSelector({ value, onChange, className }: QuestionTypeSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as QuestionType)}>
      <SelectTrigger className={className ?? "w-52 h-9 text-[13px]"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {QUESTION_TYPES.map((qt) => (
          <SelectItem key={qt.value} value={qt.value}>
            <span className="flex items-center gap-2">
              <qt.icon size={14} strokeWidth={1.5} className="text-gray-400" />
              {qt.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { QUESTION_TYPES };
