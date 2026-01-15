import { Card, CardContent, CardHeader } from '@/components/ui/card';
import PageLayout from '@/components/layout/PageLayout';

export function BlogListSkeleton() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 animate-pulse">
        {/* Title */}
        <div className="h-10 bg-muted rounded w-24 mb-8" />
        {/* Filter/search bar skeleton */}
        <div className="h-10 bg-muted rounded w-full max-w-md mb-8" />
        {/* Blog cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-muted rounded" />
                  <div className="h-5 w-12 bg-muted rounded" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
