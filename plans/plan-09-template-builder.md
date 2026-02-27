# Plan 09 — Template Builder UI

> Build the drag-and-drop evaluation template builder with live preview.

## Problem

Template builder store exists (`src/store/template-builder.ts`) but the actual builder UI components are not built. The `src/components/templates/` directory is empty.

## Scope

### 1. Template Builder Components
- [ ] `src/components/templates/template-builder.tsx` — Main builder layout (sidebar + canvas + preview)
- [ ] `src/components/templates/section-editor.tsx` — Add/edit/reorder sections
- [ ] `src/components/templates/question-editor.tsx` — Add/edit questions within sections
- [ ] `src/components/templates/template-preview.tsx` — Live preview panel showing form as reviewer would see it

### 2. Question Types
- [ ] Rating Scale — configurable min/max (default 1-5), custom labels
- [ ] Text — free text response (short/long)
- [ ] Multiple Choice — configurable options list
- [ ] Yes/No — binary choice
- [ ] Competency Matrix — grid of competencies × rating levels

### 3. Drag and Drop
- [ ] Reorder sections via drag
- [ ] Reorder questions within sections via drag
- [ ] Move questions between sections
- [ ] Consider using `@dnd-kit/core` or native HTML drag API

### 4. Template Builder Store
- [ ] Verify `src/store/template-builder.ts` has all needed actions:
  - addSection, removeSection, updateSection, reorderSections
  - addQuestion, removeQuestion, updateQuestion, reorderQuestions
  - setTemplate, resetTemplate
  - getTemplateJSON (for API submission)

### 5. Template Form Integration
- [ ] `/templates/new` page uses builder to create template → `POST /api/templates`
- [ ] `/templates/[id]` page loads existing template into builder → `PATCH /api/templates/[id]`
- [ ] Template duplication feature

## Files to Create

- `src/components/templates/template-builder.tsx`
- `src/components/templates/section-editor.tsx`
- `src/components/templates/question-editor.tsx`
- `src/components/templates/template-preview.tsx`
- `src/components/templates/question-type-selector.tsx`
- `src/components/templates/drag-handle.tsx`

## Files to Modify

- `src/store/template-builder.ts` (verify/complete)
- `src/app/(dashboard)/templates/new/page.tsx` (integrate builder)
- `src/app/(dashboard)/templates/[templateId]/page.tsx` (integrate builder)

## Dependencies

- Plan 01 (templates API must work)
- May need new dependency: `@dnd-kit/core` + `@dnd-kit/sortable`
