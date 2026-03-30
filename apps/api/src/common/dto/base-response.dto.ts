export class BaseResponseDto<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;

  constructor(
    success: boolean,
    data?: T,
    message?: string,
    error?: string
  ) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data?: T, message?: string): BaseResponseDto<T> {
    return new BaseResponseDto(true, data, message);
  }

  static error<T>(error: string, message?: string): BaseResponseDto<T> {
    return new BaseResponseDto(false, undefined, message, error);
  }
}