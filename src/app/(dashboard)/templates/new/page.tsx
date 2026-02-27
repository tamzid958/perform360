"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useTemplateBuilder } from "@/store/template-builder";
import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const questionTypes = [
  { value: "rating_scale", label: "Rating Scale" },
  { value: "text", label: "Text Response" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "yes_no", label: "Yes / No" },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const {
    name, description, sections,
    setName, setDescription, addSection, updateSection, removeSection,
    addQuestion, updateQuestion, removeQuestion,
  } = useTemplateBuilder();
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, sections }),
      });
      if (res.ok) {
        router.push("/templates");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Create Template" description="Design an evaluation form template">
        <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={handleSave} disabled={isLoading || !name}>
          {isLoading ? "Saving..." : "Save Template"}
        </Button>
      </PageHeader>

      {/* Template Info */}
      <Card className="mb-6 max-w-4xl">
        <div className="space-y-4">
          <Input
            id="template-name"
            label="Template Name"
            placeholder="e.g. Standard 360° Review"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label htmlFor="template-desc" className="block text-[13px] font-medium text-gray-700">Description</label>
            <textarea
              id="template-desc"
              placeholder="Brief description of this template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all duration-200 resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Sections */}
      <div className="space-y-4 max-w-4xl">
        {sections.map((section) => (
          <Card key={section.id} padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GripVertical size={16} strokeWidth={1.5} className="text-gray-300 cursor-grab" />
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  className="text-headline text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                  placeholder="Section title"
                />
                <Badge variant="outline">{section.questions.length} questions</Badge>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleSection(section.id)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  {expandedSections.has(section.id) ? (
                    <ChevronUp size={16} strokeWidth={1.5} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} strokeWidth={1.5} className="text-gray-400" />
                  )}
                </button>
                <button onClick={() => removeSection(section.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={16} strokeWidth={1.5} className="text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            {expandedSections.has(section.id) && (
              <div className="space-y-3 mt-4">
                {section.questions.map((question) => (
                  <div key={question.id} className="flex gap-3 p-3 rounded-xl bg-gray-50 items-start">
                    <GripVertical size={14} strokeWidth={1.5} className="text-gray-300 cursor-grab mt-3" />
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updateQuestion(section.id, question.id, { text: e.target.value })}
                        className="w-full text-[14px] text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        placeholder="Enter question text..."
                      />
                      <div className="flex gap-3 items-center">
                        <Select
                          value={question.type}
                          onValueChange={(val) => updateQuestion(section.id, question.id, { type: val as typeof question.type })}
                        >
                          <SelectTrigger className="w-48 h-9 text-[13px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {questionTypes.map((qt) => (
                              <SelectItem key={qt.value} value={qt.value}>{qt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-1.5 text-[13px] text-gray-500">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => updateQuestion(section.id, question.id, { required: e.target.checked })}
                            className="rounded"
                          />
                          Required
                        </label>
                      </div>
                    </div>
                    <button onClick={() => removeQuestion(section.id, question.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={14} strokeWidth={1.5} className="text-gray-300 hover:text-red-500" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addQuestion(section.id)}
                  className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-[13px] font-medium text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                >
                  + Add Question
                </button>
              </div>
            )}
          </Card>
        ))}

        <button
          onClick={() => {
            addSection();
          }}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-[14px] font-medium text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
        >
          <Plus size={16} strokeWidth={2} className="inline mr-1.5" />
          Add Section
        </button>
      </div>
    </div>
  );
}
