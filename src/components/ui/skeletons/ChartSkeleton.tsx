import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface ChartSkeletonProps {
  showTitle?: boolean;
  height?: string;
}

export function ChartSkeleton({ showTitle = true, height = 'h-64' }: ChartSkeletonProps) {
  return (
    <Card className="animate-pulse">
      {showTitle && (
        <CardHeader>
          <div className="h-6 bg-muted rounded w-40" />
        </CardHeader>
      )}
      <CardContent>
        <div className={`${height} bg-muted rounded`} />
      </CardContent>
    </Card>
  );
}
