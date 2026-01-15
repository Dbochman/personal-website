import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon?: LucideIcon;
  subtitle?: string;
  trend?: number;
  status?: 'good' | 'warning' | 'critical';
}

export const MetricCard = memo(function MetricCard({ title, value, icon: Icon, subtitle, trend, status }: MetricCardProps) {
  const statusColors = {
    good: 'text-emerald-500',
    warning: 'text-amber-500',
    critical: 'text-red-500',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', status && statusColors[status])}>
          {value}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={cn(
              'flex items-center text-xs',
              trend >= 0 ? 'text-emerald-500' : 'text-red-500'
            )}>
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(trend).toFixed(0)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
})
