interface ErrorLogEntry {
  timestamp: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  userAgent: string;
  url: string;
  userId?: string;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: ErrorLogEntry[] = [];
  private maxQueueSize = 50;
  private flushInterval = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    // Start periodic flush
    this.startPeriodicFlush();

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: Error, context?: Record<string, unknown>) {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId()
    };

    this.errorQueue.push(entry);

    // Store locally for debugging
    this.storeLocally(entry);

    // Flush if queue is full
    if (this.errorQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  private getUserId(): string | undefined {
    // Get user ID from auth context or localStorage
    const authData = localStorage.getItem('coretet-auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.userId;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private storeLocally(entry: ErrorLogEntry) {
    try {
      const stored = localStorage.getItem('coretet-error-log');
      const errors = stored ? JSON.parse(stored) : [];
      
      errors.push(entry);
      
      // Keep only last 20 errors
      if (errors.length > 20) {
        errors.splice(0, errors.length - 20);
      }
      
      localStorage.setItem('coretet-error-log', JSON.stringify(errors));
    } catch (e) {
      console.error('Failed to store error log locally:', e);
    }
  }

  private startPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      if (this.errorQueue.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  private async flush() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // In production, you would send these to your error tracking service
      // For now, just log to console in development
      if (import.meta.env.DEV) {
        console.group('📊 Error Log Batch');
        errors.forEach(error => {
          console.error(error);
        });
        console.groupEnd();
      } else {
        // Example: Send to error tracking service
        // await fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ errors })
        // });
      }
    } catch (e) {
      console.error('Failed to flush error log:', e);
      // Re-add errors to queue if flush failed
      this.errorQueue.unshift(...errors);
    }
  }

  getStoredErrors(): ErrorLogEntry[] {
    try {
      const stored = localStorage.getItem('coretet-error-log');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearStoredErrors() {
    localStorage.removeItem('coretet-error-log');
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

export const errorLogger = ErrorLogger.getInstance();