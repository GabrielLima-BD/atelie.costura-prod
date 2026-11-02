import { app } from '../../backend/src/app.js';

type AppRequest = Parameters<typeof app>[0];
type AppResponse = Parameters<typeof app>[1];

export default function handler(request: AppRequest, response: AppResponse) {
  const url = request.url ?? '/';
  if (!url.startsWith('/v1/') && !url.startsWith('/api/v1/')) {
    request.url = `/v1${url.startsWith('/') ? url : `/${url}`}`;
  }
  return app(request, response);
}
