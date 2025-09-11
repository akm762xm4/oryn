// Performance monitoring utilities

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('navigation', {
                loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
                renderTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              });
            }
          });
        });
        
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Navigation performance observer not supported:', error);
      }

      // Monitor paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.recordMetric('fcp', {
                loadTime: entry.startTime,
                renderTime: entry.duration,
              });
            }
          });
        });
        
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (error) {
        console.warn('Paint performance observer not supported:', error);
      }
    }
  }

  recordMetric(name: string, metric: PerformanceMetrics) {
    this.metrics.set(name, {
      ...metric,
      memoryUsage: this.getMemoryUsage(),
    });
  }

  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize;
    }
    return undefined;
  }

  getMetric(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): Record<string, PerformanceMetrics> {
    return Object.fromEntries(this.metrics);
  }

  // Measure component render time
  measureRender<T>(componentName: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.recordMetric(`render-${componentName}`, {
      loadTime: 0,
      renderTime: end - start,
    });
    
    return result;
  }

  // Clean up observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMetrics(componentName: string) {
  const recordRender = (renderTime: number) => {
    performanceMonitor.recordMetric(`component-${componentName}`, {
      loadTime: 0,
      renderTime,
    });
  };

  return { recordRender };
}

// Preload critical resources
export function preloadCriticalResources() {
  const criticalRoutes = ['/login', '/chat'];
  
  criticalRoutes.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });
}

// Image lazy loading utility
export function createImageObserver(callback: (entry: IntersectionObserverEntry) => void) {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver(
      (entries) => {
        entries.forEach(callback);
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );
  }
  return null;
}
