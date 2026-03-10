export interface JSendSuccess<T> {
  status: 'success';
  data: T;
}

export interface JSendFail<T = Record<string, string>> {
  status: 'fail';
  data: T;
}

export interface JSendError {
  status: 'error';
  message: string;
  code?: number;
  data?: unknown;
}

export type JSendResponse<T> = JSendSuccess<T> | JSendFail | JSendError;
