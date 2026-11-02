import { app } from '../backend/src/app.js';

type AppRequest = Parameters<typeof app>[0];
type AppResponse = Parameters<typeof app>[1];

export default function handler(request: AppRequest, response: AppResponse) {
  const url = request.url ?? '/';
  if (url.startsWith('/api/')) {
    request.url = url.slice(4) || '/';
  }
  if (
    request.url !== '/health' &&
    !request.url.startsWith('/v1/') &&
    !request.url.startsWith('/api/v1/')
  ) {
    request.url = `/v1${request.url.startsWith('/') ? request.url : `/${request.url}`}`;
  }
  return app(request, response);
}
