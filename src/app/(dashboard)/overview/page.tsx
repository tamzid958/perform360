import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import {
  RefreshCcw,
  Users,
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Active Cycles", value: "2", icon: RefreshCcw, change: "+1 this month" },
  { label: "Total Teams", value: "8", icon: Users, change: "3 new members" },
  { label: "Pending Reviews", value: "24", icon: ClipboardCheck, change: "12 completed" },
  { label: "Completion Rate", value: "67%", icon: TrendingUp, change: "+5% this week" },
];

const recentActivity = [
  { user: "Sarah Chen", action: "submitted evaluation for", target: "Alex Kim", time: "2 hours ago" },
  { user: "Mike Johnson", action: "was assigned to evaluate", target: "Lisa Park", time: "4 hours ago" },
  { user: "Emily Davis", action: "completed self-evaluation in", target: "Q1 Review", time: "Yesterday" },
  { user: "James Wilson", action: "submitted evaluation for", target: "Sarah Chen", time: "Yesterday" },
  { user: "Admin", action: "created new cycle", target: "Q1 2026 Review", time: "2 days ago" },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your organization's evaluation activity"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-callout text-gray-500">{stat.label}</p>
                  <p className="text-title-small text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-[12px] text-gray-400 mt-1">{stat.change}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50">
                  <Icon size={20} strokeWidth={1.5} className="text-gray-400" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Cycle */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Q1 2026 Performance Review</CardTitle>
                  <CardDescription>Active cycle ending March 31, 2026</CardDescription>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="text-gray-500">Overall Progress</span>
                  <span className="font-medium text-gray-700">67%</span>
                </div>
                <Progress value={67} />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <p className="text-title-small text-gray-900">48</p>
                  <p className="text-[12px] text-gray-500">Total</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-green-50">
                  <p className="text-title-small text-green-700">32</p>
                  <p className="text-[12px] text-green-600">Completed</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-50">
                  <p className="text-title-small text-amber-700">16</p>
                  <p className="text-[12px] text-amber-600">Pending</p>
                </div>
              </div>
              <Link
                href="/cycles"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-500 hover:text-brand-600 transition-colors mt-2"
              >
                View all cycles <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Clock size={14} strokeWidth={1.5} className="text-gray-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-700 leading-relaxed">
                    <span className="font-medium">{activity.user}</span>{" "}
                    {activity.action}{" "}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="text-[12px] text-gray-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
