import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// Report Core Web Vitals to Google Analytics
export function reportWebVitals() {
  // Only track in production
  if (import.meta.env.MODE !== 'production') {
    return;
  }

  // Check if gtag is available
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  const sendToGoogleAnalytics = ({ name, delta, value, id }: {
    name: string;
    delta: number;
    value: number;
    id: string;
  }) => {
    // Send the metric to Google Analytics as an event
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? delta * 1000 : delta), // CLS is multiplied by 1000 for better precision
      non_interaction: true,
      // Custom dimensions for detailed analysis
      metric_id: id,
      metric_value: value,
      metric_delta: delta,
    });
  };

  // Track Cumulative Layout Shift (CLS)
  onCLS(sendToGoogleAnalytics);

  // Track First Contentful Paint (FCP)
  onFCP(sendToGoogleAnalytics);

  // Track Interaction to Next Paint (INP) - replaces FID
  onINP(sendToGoogleAnalytics);

  // Track Largest Contentful Paint (LCP)
  onLCP(sendToGoogleAnalytics);

  // Track Time to First Byte (TTFB)
  onTTFB(sendToGoogleAnalytics);
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (
      command: string,
      eventName: string,
      eventParams?: Record<string, any>
    ) => void;
  }
}
