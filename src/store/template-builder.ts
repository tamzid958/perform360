import { create } from "zustand";

interface TemplateQuestion {
  id: string;
  text: string;
  type: "rating_scale" | "text" | "multiple_choice" | "yes_no" | "competency_matrix";
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
  conditionalOn?: string;
}

interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  questions: TemplateQuestion[];
}

interface TemplateBuilderState {
  name: string;
  description: string;
  sections: TemplateSection[];
  activeSection: string | null;
  activeQuestion: string | null;
  isDirty: boolean;

  // Actions
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  addSection: () => void;
  updateSection: (sectionId: string, data: Partial<TemplateSection>) => void;
  removeSection: (sectionId: string) => void;
  moveSection: (fromIndex: number, toIndex: number) => void;
  addQuestion: (sectionId: string) => void;
  updateQuestion: (sectionId: string, questionId: string, data: Partial<TemplateQuestion>) => void;
  removeQuestion: (sectionId: string, questionId: string) => void;
  moveQuestion: (sectionId: string, fromIndex: number, toIndex: number) => void;
  setActiveSection: (sectionId: string | null) => void;
  setActiveQuestion: (questionId: string | null) => void;
  reset: () => void;
  loadTemplate: (data: { name: string; description: string; sections: TemplateSection[] }) => void;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const useTemplateBuilder = create<TemplateBuilderState>((set) => ({
  name: "",
  description: "",
  sections: [],
  activeSection: null,
  activeQuestion: null,
  isDirty: false,

  setName: (name) => set({ name, isDirty: true }),
  setDescription: (description) => set({ description, isDirty: true }),

  addSection: () =>
    set((state) => ({
      sections: [
        ...state.sections,
        { id: generateId(), title: "New Section", questions: [] },
      ],
      isDirty: true,
    })),

  updateSection: (sectionId, data) =>
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId ? { ...s, ...data } : s
      ),
      isDirty: true,
    })),

  removeSection: (sectionId) =>
    set((state) => ({
      sections: state.sections.filter((s) => s.id !== sectionId),
      isDirty: true,
    })),

  moveSection: (fromIndex, toIndex) =>
    set((state) => {
      const sections = [...state.sections];
      const [moved] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, moved);
      return { sections, isDirty: true };
    }),

  addQuestion: (sectionId) =>
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: [
                ...s.questions,
                {
                  id: generateId(),
                  text: "",
                  type: "rating_scale" as const,
                  required: true,
                  scaleMin: 1,
                  scaleMax: 5,
                },
              ],
            }
          : s
      ),
      isDirty: true,
    })),

  updateQuestion: (sectionId, questionId, data) =>
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId ? { ...q, ...data } : q
              ),
            }
          : s
      ),
      isDirty: true,
    })),

  removeQuestion: (sectionId, questionId) =>
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId
          ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
          : s
      ),
      isDirty: true,
    })),

  moveQuestion: (sectionId, fromIndex, toIndex) =>
    set((state) => ({
      sections: state.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const questions = [...s.questions];
        const [moved] = questions.splice(fromIndex, 1);
        questions.splice(toIndex, 0, moved);
        return { ...s, questions };
      }),
      isDirty: true,
    })),

  setActiveSection: (sectionId) => set({ activeSection: sectionId }),
  setActiveQuestion: (questionId) => set({ activeQuestion: questionId }),

  reset: () =>
    set({
      name: "",
      description: "",
      sections: [],
      activeSection: null,
      activeQuestion: null,
      isDirty: false,
    }),

  loadTemplate: (data) =>
    set({
      name: data.name,
      description: data.description,
      sections: data.sections,
      isDirty: false,
    }),
}));
