import { Card, CardContent, CardHeader } from '@/components/ui/card';
import PageLayout from '@/components/layout/PageLayout';

export function ProjectGridSkeleton() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 animate-pulse">
        {/* Title */}
        <div className="h-10 bg-muted rounded w-32 mb-4" />
        {/* Subtitle */}
        <div className="h-6 bg-muted rounded w-2/3 mb-8" />
        {/* Project cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 bg-muted rounded" />
                  <div className="h-6 bg-muted rounded w-2/3" />
                </div>
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-muted rounded" />
                  <div className="h-5 w-14 bg-muted rounded" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
