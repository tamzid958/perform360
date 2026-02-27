import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Plus, FileText, Globe, Building2, ChevronRight } from "lucide-react";
import Link from "next/link";

const templates = [
  { id: "1", name: "Standard 360° Review", description: "Comprehensive evaluation covering leadership, communication, and technical skills", isGlobal: true, sections: 4, questions: 20, lastUsed: "2 days ago" },
  { id: "2", name: "Leadership Assessment", description: "Focused evaluation for leadership and management competencies", isGlobal: true, sections: 3, questions: 15, lastUsed: "1 week ago" },
  { id: "3", name: "Quick Check-in", description: "Lightweight mid-cycle check-in template", isGlobal: false, sections: 2, questions: 8, lastUsed: "3 weeks ago" },
  { id: "4", name: "Engineering Performance", description: "Technical evaluation tailored for engineering teams", isGlobal: false, sections: 5, questions: 25, lastUsed: "1 month ago" },
  { id: "5", name: "New Hire 90-Day Review", description: "Onboarding evaluation for new team members", isGlobal: false, sections: 3, questions: 12, lastUsed: "Never" },
];

export default function TemplatesPage() {
  return (
    <div>
      <PageHeader title="Templates" description="Manage evaluation form templates">
        <Link href="/templates/new">
          <Button>
            <Plus size={16} strokeWidth={2} className="mr-1.5" />
            New Template
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Link key={template.id} href={`/templates/${template.id}`}>
            <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-gray-50">
                  <FileText size={20} strokeWidth={1.5} className="text-gray-500" />
                </div>
                <div className="flex items-center gap-2">
                  {template.isGlobal ? (
                    <Badge variant="info">
                      <Globe size={10} strokeWidth={2} className="mr-1" />
                      Global
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Building2 size={10} strokeWidth={2} className="mr-1" />
                      Company
                    </Badge>
                  )}
                  <ChevronRight size={16} strokeWidth={1.5} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </div>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
              <div className="flex items-center gap-3 mt-4 text-[12px] text-gray-400">
                <span>{template.sections} sections</span>
                <span>·</span>
                <span>{template.questions} questions</span>
                <span>·</span>
                <span>Used {template.lastUsed}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
