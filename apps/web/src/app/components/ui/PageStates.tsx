import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title = 'No records found',
  message = 'There is nothing to display yet.',
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 sm:py-16 px-4 text-gray-500">
      <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p className="font-medium text-gray-700">{title}</p>
      <p className="text-sm mt-1 max-w-md mx-auto">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 gap-3">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
