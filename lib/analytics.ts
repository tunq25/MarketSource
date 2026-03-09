/**
 * Client-side Analytics Helper
 */

export function trackEvent(eventType: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  try {
    // Send to analytics API
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        eventData: properties || {},
      }),
    }).catch(error => {
      console.warn('Analytics tracking failed:', error);
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
}

// Convenience functions
export function trackPageView(path: string) {
  trackEvent('page_view', { path });
}

export function trackProductView(productId: number, productName?: string, category?: string) {
  trackEvent('product_view', { productId, productName, category });
}

export function trackProductPurchase(productId: number, amount: number) {
  trackEvent('purchase', { productId, amount });
}

export function trackAddToWishlist(productId: number) {
  trackEvent('add_to_wishlist', { productId });
}

export function trackSearch(query: string, resultsCount: number) {
  trackEvent('search', { query, resultsCount });
}

export function trackButtonClick(buttonName: string, location?: string) {
  trackEvent('button_click', { buttonName, location });
}

