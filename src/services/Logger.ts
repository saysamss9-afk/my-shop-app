/**
 * Centralized logging service for the application.
 * In production, this can be extended to send logs to external services like Sentry or Firebase Crashlytics.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isProduction = !__DEV__;

  log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (this.isProduction) {
      // In production, we might want to send errors to a remote service
      if (level === 'error' || level === 'warn') {
        // Example: Sentry.captureMessage(formattedMessage);
        // Example: crashlytics().log(formattedMessage);
      }
    }

    switch (level) {
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'error':
        console.error(formattedMessage, data || '');
        break;
      case 'debug':
        if (!this.isProduction) {
          console.debug(formattedMessage, data || '');
        }
        break;
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }
}

export const logger = new Logger();
