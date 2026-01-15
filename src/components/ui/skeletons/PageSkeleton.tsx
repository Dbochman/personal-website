import PageLayout from '@/components/layout/PageLayout';

export function PageSkeleton() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 animate-pulse">
        {/* Title */}
        <div className="h-10 bg-muted rounded w-1/3 mb-4" />
        {/* Subtitle */}
        <div className="h-6 bg-muted rounded w-2/3 mb-8" />
        {/* Content blocks */}
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/6" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    </PageLayout>
  );
}
