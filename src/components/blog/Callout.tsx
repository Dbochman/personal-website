import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export type CalloutType = 'info' | 'warning' | 'success' | 'error';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const calloutStyles: Record<CalloutType, { bg: string; border: string; icon: React.ReactNode }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
  },
};

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const style = calloutStyles[type];

  return (
    <div className={`my-6 rounded-lg border-l-4 ${style.border} ${style.bg} p-4`}>
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">{style.icon}</div>
        <div className="flex-1">
          {title && (
            <div className="font-semibold mb-2 text-foreground">{title}</div>
          )}
          <div className="text-foreground/90 [&>p]:my-2 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
