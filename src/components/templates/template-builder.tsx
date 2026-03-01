"use client";

import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Plus, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTemplateBuilder } from "@/store/template-builder";
import { SectionEditor } from "./section-editor";
import { TemplatePreview } from "./template-preview";

export function TemplateBuilder() {
  const {
    name,
    description,
    sections,
    setName,
    setDescription,
    addSection,
    updateSection,
    removeSection,
    moveSection,
    addQuestion,
    updateQuestion,
    removeQuestion,
    moveQuestion,
    moveQuestionBetweenSections,
  } = useTemplateBuilder();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeData = active.data.current as { type: string; sectionId?: string } | undefined;
      const overData = over.data.current as { type: string; sectionId?: string } | undefined;

      if (activeData?.type === "section" && overData?.type === "section") {
        const fromIndex = sections.findIndex((s) => s.id === active.id);
        const toIndex = sections.findIndex((s) => s.id === over.id);
        if (fromIndex !== -1 && toIndex !== -1) {
          moveSection(fromIndex, toIndex);
        }
        return;
      }

      if (activeData?.type === "question" && overData?.type === "question") {
        const fromSectionId = activeData.sectionId;
        const toSectionId = overData.sectionId;

        if (!fromSectionId || !toSectionId) return;

        if (fromSectionId === toSectionId) {
          const section = sections.find((s) => s.id === fromSectionId);
          if (!section) return;
          const fromIndex = section.questions.findIndex((q) => q.id === active.id);
          const toIndex = section.questions.findIndex((q) => q.id === over.id);
          if (fromIndex !== -1 && toIndex !== -1) {
            moveQuestion(fromSectionId, fromIndex, toIndex);
          }
        } else {
          const fromSection = sections.find((s) => s.id === fromSectionId);
          const toSection = sections.find((s) => s.id === toSectionId);
          if (!fromSection || !toSection) return;
          const fromIndex = fromSection.questions.findIndex((q) => q.id === active.id);
          const toIndex = toSection.questions.findIndex((q) => q.id === over.id);
          if (fromIndex !== -1 && toIndex !== -1) {
            moveQuestionBetweenSections(fromSectionId, toSectionId, fromIndex, toIndex);
          }
        }
      }
    },
    [sections, moveSection, moveQuestion, moveQuestionBetweenSections]
  );

  const sectionIds = sections.map((s) => s.id);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start">
      {/* Builder panel */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Template info */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100/50 p-6 space-y-4">
          <Input
            id="template-name"
            label="Template Name"
            placeholder="e.g. Standard 360° Review"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label htmlFor="template-desc" className="block text-[13px] font-medium text-gray-700">
              Description
            </label>
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

        {/* Sections with DnD */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                onUpdateSection={(data) => updateSection(section.id, data)}
                onRemoveSection={() => removeSection(section.id)}
                onAddQuestion={() => addQuestion(section.id)}
                onUpdateQuestion={(qId, data) => updateQuestion(section.id, qId, data)}
                onRemoveQuestion={(qId) => removeQuestion(section.id, qId)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add section button */}
        <button
          type="button"
          onClick={addSection}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-[14px] font-medium text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus size={16} strokeWidth={2} />
          Add Section
        </button>
      </div>

      {/* Preview panel */}
      <div className="w-[380px] shrink-0 sticky top-6 hidden xl:block">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100/50 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <Eye size={14} strokeWidth={1.5} className="text-gray-400" />
            <span className="text-[13px] font-medium text-gray-500">Live Preview</span>
          </div>
          <div className="p-5 max-h-[calc(100vh-10rem)] overflow-y-auto">
            <TemplatePreview name={name} description={description} sections={sections} />
          </div>
        </div>
      </div>
    </div>
  );
}
