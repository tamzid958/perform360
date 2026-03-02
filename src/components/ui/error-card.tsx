import { AlertCircle } from "lucide-react";
import { Card } from "./card";
import { Button } from "./button";

interface ErrorCardProps {
  message: string;
  hint?: string;
  onRetry?: () => void;
}

export function ErrorCard({ message, hint, onRetry }: ErrorCardProps) {
  return (
    <Card className="max-w-lg mx-auto mt-12 text-center">
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950">
          <AlertCircle size={24} strokeWidth={1.5} className="text-red-400" />
        </div>
        <div className="space-y-1">
          <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100">{message}</p>
          {hint && <p className="text-[13px] text-gray-500 dark:text-gray-400">{hint}</p>}
        </div>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>
        )}
      </div>
    </Card>
  );
}
