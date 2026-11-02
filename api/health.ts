type HealthResponse = {
  status: (code: number) => {
    json: (body: { status: string; service: string }) => void;
  };
};

export default function health(_request: unknown, response: HealthResponse) {
  response.status(200).json({ status: 'ok', service: 'atelier-api' });
}
