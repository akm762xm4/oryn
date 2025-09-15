// Memory optimization and cleanup utilities

export interface CleanupFunction {
  (): void;
}

class MemoryManager {
  private cleanupTasks: Map<string, CleanupFunction[]> = new Map();
  private intervalRefs: Map<string, ReturnType<typeof setInterval>> = new Map();
  private timeoutRefs: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private eventListeners: Map<
    string,
    { element: EventTarget; event: string; handler: EventListener }[]
  > = new Map();

  // Register cleanup tasks for a component
  registerCleanup(componentId: string, cleanup: CleanupFunction) {
    if (!this.cleanupTasks.has(componentId)) {
      this.cleanupTasks.set(componentId, []);
    }
    this.cleanupTasks.get(componentId)!.push(cleanup);
  }

  // Register an interval for cleanup
  registerInterval(
    componentId: string,
    intervalRef: ReturnType<typeof setInterval>
  ) {
    this.intervalRefs.set(`${componentId}-${Date.now()}`, intervalRef);

    this.registerCleanup(componentId, () => {
      clearInterval(intervalRef);
    });
  }

  // Register a timeout for cleanup
  registerTimeout(
    componentId: string,
    timeoutRef: ReturnType<typeof setTimeout>
  ) {
    this.timeoutRefs.set(`${componentId}-${Date.now()}`, timeoutRef);

    this.registerCleanup(componentId, () => {
      clearTimeout(timeoutRef);
    });
  }

  // Register event listeners for cleanup
  registerEventListener(
    componentId: string,
    element: EventTarget,
    event: string,
    handler: EventListener
  ) {
    if (!this.eventListeners.has(componentId)) {
      this.eventListeners.set(componentId, []);
    }

    this.eventListeners.get(componentId)!.push({ element, event, handler });
    element.addEventListener(event, handler);

    this.registerCleanup(componentId, () => {
      element.removeEventListener(event, handler);
    });
  }

  // Clean up all resources for a component
  cleanup(componentId: string) {
    const tasks = this.cleanupTasks.get(componentId);
    if (tasks) {
      tasks.forEach((task) => {
        try {
          task();
        } catch (error) {
          console.warn(`Cleanup error for ${componentId}:`, error);
        }
      });
      this.cleanupTasks.delete(componentId);
    }

    // Clean up stored references
    for (const [key] of this.intervalRefs) {
      if (key.startsWith(componentId)) {
        this.intervalRefs.delete(key);
      }
    }

    for (const [key] of this.timeoutRefs) {
      if (key.startsWith(componentId)) {
        this.timeoutRefs.delete(key);
      }
    }

    this.eventListeners.delete(componentId);
  }

  // Clean up all resources (for app unmount)
  cleanupAll() {
    for (const componentId of this.cleanupTasks.keys()) {
      this.cleanup(componentId);
    }
  }

  // Get memory usage info
  getMemoryInfo() {
    return {
      cleanupTasks: this.cleanupTasks.size,
      intervals: this.intervalRefs.size,
      timeouts: this.timeoutRefs.size,
      eventListeners: Array.from(this.eventListeners.values()).reduce(
        (sum, arr) => sum + arr.length,
        0
      ),
    };
  }
}

// Singleton instance
export const memoryManager = new MemoryManager();

// React hook for automatic cleanup
export function useMemoryCleanup(componentName: string) {
  const componentId = `${componentName}-${Date.now()}-${Math.random()}`;

  const registerCleanup = (cleanup: CleanupFunction) => {
    memoryManager.registerCleanup(componentId, cleanup);
  };

  const registerInterval = (callback: () => void, delay: number) => {
    const intervalRef = setInterval(callback, delay);
    memoryManager.registerInterval(componentId, intervalRef);
    return intervalRef;
  };

  const registerTimeout = (callback: () => void, delay: number) => {
    const timeoutRef = setTimeout(callback, delay);
    memoryManager.registerTimeout(componentId, timeoutRef);
    return timeoutRef;
  };

  const registerEventListener = (
    element: EventTarget,
    event: string,
    handler: EventListener
  ) => {
    memoryManager.registerEventListener(componentId, element, event, handler);
  };

  const cleanup = () => {
    memoryManager.cleanup(componentId);
  };

  // Cleanup on page unload or network disconnection
  if (typeof window !== "undefined") {
    const handleBeforeUnload = () => {
      cleanup();
    };

    const handleOffline = () => {
      // Pause intervals and timeouts when offline to save resources
      const intervals = Array.from(
        memoryManager["intervalRefs"].entries()
      ).filter(([key]) => key.startsWith(componentId));
      const timeouts = Array.from(
        memoryManager["timeoutRefs"].entries()
      ).filter(([key]) => key.startsWith(componentId));

      intervals.forEach(([, intervalRef]) => clearInterval(intervalRef));
      timeouts.forEach(([, timeoutRef]) => clearTimeout(timeoutRef));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("offline", handleOffline);

    // Cleanup listeners
    registerCleanup(() => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("offline", handleOffline);
    });
  }

  return {
    registerCleanup,
    registerInterval,
    registerTimeout,
    registerEventListener,
    cleanup,
    componentId,
  };
}

// WeakMap for storing component data to prevent memory leaks
export const componentDataMap = new WeakMap();

// Optimized debounce function with cleanup
export function createDebouncedFunction<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  componentId?: string
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T & { cancel: () => void };

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  // Register cleanup if component ID provided
  if (componentId) {
    memoryManager.registerCleanup(componentId, debouncedFn.cancel);
  }

  return debouncedFn;
}

// Optimized throttle function with cleanup
export function createThrottledFunction<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  componentId?: string
): T & { cancel: () => void } {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttledFn = ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delay) {
      fn(...args);
      lastCallTime = now;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        fn(...args);
        lastCallTime = Date.now();
        timeoutId = null;
      }, delay - timeSinceLastCall);
    }
  }) as T & { cancel: () => void };

  throttledFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  // Register cleanup if component ID provided
  if (componentId) {
    memoryManager.registerCleanup(componentId, throttledFn.cancel);
  }

  return throttledFn;
}
