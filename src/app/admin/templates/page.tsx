import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Globe, ChevronRight } from "lucide-react";

interface GlobalTemplate {
  id: string;
  name: string;
  description: string;
  sections: number;
  questions: number;
  usedBy: number;
}

const globalTemplates: GlobalTemplate[] = [
  {
    id: "1",
    name: "Standard 360\u00B0 Review",
    description:
      "Comprehensive evaluation covering leadership, communication, and technical skills",
    sections: 4,
    questions: 20,
    usedBy: 28,
  },
  {
    id: "2",
    name: "Leadership Assessment",
    description:
      "Focused evaluation for leadership and management competencies",
    sections: 3,
    questions: 15,
    usedBy: 12,
  },
  {
    id: "3",
    name: "Quick Check-in",
    description: "Lightweight mid-cycle check-in template",
    sections: 2,
    questions: 8,
    usedBy: 35,
  },
  {
    id: "4",
    name: "New Hire 90-Day",
    description: "Onboarding evaluation for new team members",
    sections: 3,
    questions: 12,
    usedBy: 8,
  },
];

export default function GlobalTemplatesPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-title text-gray-900">Global Templates</h1>
          <p className="text-body text-gray-500 mt-1">
            Templates available to all tenant companies
          </p>
        </div>
        <Button>
          <Plus size={16} strokeWidth={2} className="mr-1.5" />
          New Global Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {globalTemplates.map((template) => (
          <Card
            key={template.id}
            className="hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-blue-50">
                <Globe
                  size={20}
                  strokeWidth={1.5}
                  className="text-[#0071e3]"
                />
              </div>
              <ChevronRight
                size={16}
                strokeWidth={1.5}
                className="text-gray-300 group-hover:text-gray-500 transition-colors"
              />
            </div>
            <CardTitle>{template.name}</CardTitle>
            <CardDescription>{template.description}</CardDescription>
            <div className="flex items-center gap-3 mt-4 text-[12px] text-gray-400">
              <span>{template.sections} sections</span>
              <span>&middot;</span>
              <span>{template.questions} questions</span>
              <span>&middot;</span>
              <Badge variant="outline">
                Used by {template.usedBy} companies
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
