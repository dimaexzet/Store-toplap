// Monitoring configuration for Sentry
// This file should be imported in your project entry point

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

export function initializeMonitoring() {
  if (SENTRY_DSN && process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.5, // Adjust sampling rate as needed
      replaysSessionSampleRate: 0.1, // Adjust replay session sample rate as needed
      replaysOnErrorSampleRate: 1.0, // Capture all sessions with errors
      profilesSampleRate: 0.2, // Adjust profiles sample rate as needed
      
      // Optional: Add custom tags for better filtering in Sentry
      initialScope: {
        tags: {
          app: 'ai-amazona',
        },
      },
      
      // Performance monitoring
      integrations: [
        new Sentry.BrowserTracing({
          routingInstrumentation: Sentry.nextRouterInstrumentation(),
        }),
        new Sentry.Replay(),
        new Sentry.BrowserProfilingIntegration(),
      ],
    });
    
    console.log('Sentry monitoring initialized');
  } else {
    console.log('Sentry monitoring disabled (not in production or DSN not provided)');
  }
}

// Export custom error reporter
export function reportError(error, context = {}) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error occurred:', error, 'Context:', context);
  }
}

// Add custom breadcrumbs for better debugging
export function addBreadcrumb(category, message, data = {}) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
} 