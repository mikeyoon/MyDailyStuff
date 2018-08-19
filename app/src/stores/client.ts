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

export namespace RestClient {
  export function get(url: string) {
    return client({
      method: "GET",
      path: url
    }).then(response => (csrfToken = response.headers[CSRF_HEADER]));
  }

  export function del(url: string) {
    return client({
      method: "DELETE",
      path: url
    }).then(response => (csrfToken = response.headers[CSRF_HEADER]));
  }

  export function post(url: string, entity?: any) {
    return client({
      method: "POST",
      path: url,
      entity: JSON.stringify(entity)
    }).then(response => (csrfToken = response.headers[CSRF_HEADER]));
  }

  export function put(url: string, entity?: any) {
    return client({
      method: "PUT",
      path: url,
      entity: JSON.stringify(entity)
    }).then(response => (csrfToken = response.headers[CSRF_HEADER]));
  }
}
