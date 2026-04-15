import { ERROR_MESSAGES } from '@/constants';
import { msgUtils } from '@/utils/MessageUtils';

/**
 * 错误级别
 */
export enum ErrorLevel {
  ERROR = 'error',
  INFO = 'info',
  WARN = 'warn',
}

/**
 * 应用错误类
 * 提供统一的错误处理和日志记录
 */
export class AppError extends Error {
  public readonly code?: string;
  public readonly context?: Record<string, unknown>;
  public readonly level: ErrorLevel;
  public readonly timestamp: number;

  constructor(
    message: string,
    options: {
      cause?: Error;
      code?: string;
      context?: Record<string, unknown>;
      level?: ErrorLevel;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.level = options.level ?? ErrorLevel.ERROR;
    this.code = options.code;
    this.context = options.context;
    this.timestamp = Date.now();

    // 保留原始错误堆栈
    if (options.cause) {
      this.cause = options.cause;
    }
  }

  /**
   * 获取友好的错误消息
   */
  getFriendlyMessage(): string {
    return this.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  /**
   * 转换为可序列化的对象
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      context: this.context,
      level: this.level,
      message: this.message,
      name: this.name,
      stack: this.stack,
      timestamp: this.timestamp,
    };
  }
}

/**
 * 错误处理器
 * 提供统一的错误处理、日志记录和用户提示
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private readonly maxLogSize = 100;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 清除错误日志
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * 获取最近的错误日志
   * @param count 获取数量
   */
  getRecentErrors(count = 10): AppError[] {
    return this.errorLog.slice(-count);
  }

  /**
   * 处理错误
   * @param error 错误对象或消息
   * @param context 错误上下文信息
   * @param showUserTip 是否显示用户提示
   */
  handle(
    error: Error | string | unknown,
    context?: Record<string, unknown>,
    showUserTip = true
  ): AppError {
    const appError = this.normalizeError(error, context);

    // 记录错误日志
    this.logError(appError);

    // 根据错误级别采取不同行动
    switch (appError.level) {
      case ErrorLevel.ERROR:
        console.error('[TaskManager Error]', appError);
        if (showUserTip) {
          this.showUserNotification(appError);
        }
        break;
      case ErrorLevel.INFO:
        console.info('[TaskManager Info]', appError);
        break;
      case ErrorLevel.WARN:
        console.warn('[TaskManager Warning]', appError);
        break;
    }

    return appError;
  }

  /**
   * 异步操作的安全包装器
   * @param fn 异步函数
   * @param errorHandler 自定义错误处理函数
   * @returns 包含结果和错误的元组
   */
  async safeExecute<T>(
    fn: () => Promise<T>,
    errorHandler?: (error: AppError) => void
  ): Promise<[null | T, AppError | null]> {
    try {
      const result = await fn();
      return [result, null];
    } catch (error) {
      const appError = this.handle(error, undefined, false);
      if (errorHandler) {
        errorHandler(appError);
      }
      return [null, appError];
    }
  }

  /**
   * 记录错误到日志
   */
  private logError(error: AppError): void {
    this.errorLog.push(error);

    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
  }

  /**
   * 标准化错误对象
   */
  private normalizeError(
    error: Error | string | unknown,
    context?: Record<string, unknown>
  ): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(error.message, {
        cause: error,
        context,
      });
    }

    if (typeof error === 'string') {
      return new AppError(error, { context });
    }

    return new AppError(ERROR_MESSAGES.UNKNOWN_ERROR, {
      context: { originalError: error, ...context },
    });
  }

  /**
   * 显示用户通知
   */
  private showUserNotification(error: AppError): void {
    // 这里可以集成思源笔记的通知系统
    // 目前使用 console 作为降级方案
    const message = error.getFriendlyMessage();
    console.warn('[User Notification]', message);

    msgUtils.PushErrMsg(message).catch((err) => {
      console.error('[Notification Error] Failed to show notification:', err);
    });
  }
}

/**
 * 便捷函数：获取最近错误
 */
export function getRecentErrors(count = 10): AppError[] {
  return ErrorHandler.getInstance().getRecentErrors(count);
}

/**
 * 便捷函数：创建并处理错误
 */
export function handleError(
  error: Error | string | unknown,
  context?: Record<string, unknown>,
  showUserTip = true
): AppError {
  return ErrorHandler.getInstance().handle(error, context, showUserTip);
}

/**
 * 便捷函数：安全执行异步操作
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: AppError) => void
): Promise<[null | T, AppError | null]> {
  return ErrorHandler.getInstance().safeExecute(fn, errorHandler);
}
