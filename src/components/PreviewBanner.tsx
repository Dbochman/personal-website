import { showPreviewBanner } from '@/lib/env';

// Test change to verify preview deployments work
export function PreviewBanner() {
  if (!showPreviewBanner) return null;

  return (
    <div className="bg-yellow-500 text-black text-center py-1 text-sm font-medium sticky top-0 z-50">
      Preview Deployment - Not production
    </div>
  );
}
