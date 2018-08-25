import rest from "rest";
import mime from "rest/interceptor/mime";
import errorCode from "rest/interceptor/errorCode";
import csrf from "rest/interceptor/csrf";

const CSRF_HEADER = "X-Csrf-Token";
const client = rest
  .wrap(mime)
  .wrap(errorCode)
  .wrap(csrf);

let csrfToken = "";

const meta = document.head.querySelectorAll('meta[name="api-url"]');
const baseUrl = meta.length > 0 ? meta[0].getAttribute('content') : 'http://localhost/api';

declare module 'rest' {
  namespace rest {
    export interface Request {
			csrfToken?: string;
		}
  }
}

export namespace RestClient {
  export function get(url: string) {
    return client({
      method: "GET",
      path: baseUrl + url
    }).then(response => {
      csrfToken = response.headers[CSRF_HEADER];
      return response;
    });
  }

  export function del(url: string) {
    return client({
      method: "DELETE",
      path: baseUrl + url,
      headers: {
        [CSRF_HEADER]: csrfToken
      }
    }).then(response => {
      csrfToken = response.headers[CSRF_HEADER];
      return response;
    });
  }

  export function post(url: string, entity?: any) {
    return client({
      method: "POST",
      path: baseUrl + url,
      headers: {
        [CSRF_HEADER]: csrfToken
      },
      ...entity != null ? { entity: JSON.stringify(entity) } : {}
    }).then(response => {
      csrfToken = response.headers[CSRF_HEADER];
      return response;
    });
  }

  export function put(url: string, entity?: any) {
    return client({
      method: "PUT",
      path: baseUrl + url,
      entity: JSON.stringify(entity),
      headers: {
        [CSRF_HEADER]: csrfToken
      }
    }).then(response => {
      csrfToken = response.headers[CSRF_HEADER];
      return response;
    });
  }
}
