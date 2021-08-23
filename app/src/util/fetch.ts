export type BaseResponse<T = never> = BaseErrorResponse | BaseSuccessResponse<T>;

export interface BaseErrorResponse {
  success: false;
  error: string;
}

export interface BaseSuccessResponse<T> {
  success: true;
  result: T;
}

const CSRF_HEADER = "X-Csrf-Token";
let csrfToken: string | null = null;

const BASE_URL = '/api';

export async function fetch(url: string, init?: RequestInit) {
  if (csrfToken != null && init?.method && ['POST', 'DELETE', 'PUT'].includes(init?.method)) {
    init = {
      ...init,
      headers: {
        ...init?.headers,
        [CSRF_HEADER]: csrfToken
      }
    }
  }

  const result = await window.fetch(BASE_URL + url, init);
  if (result.status === 401) {
    window.location.href = '/login';
    // Would be nice to return a fake failure response
  }

  if (result.headers.get(CSRF_HEADER)) {
    csrfToken = result.headers.get(CSRF_HEADER);
  }

  return result;
}
