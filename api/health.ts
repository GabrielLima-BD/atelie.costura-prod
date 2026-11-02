import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function health(_request: VercelRequest, response: VercelResponse) {
  response.status(200).json({ status: 'ok', service: 'atelier-api' });
}
