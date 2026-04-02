type HttpMethod = 'GET' | 'POST' | 'PATCH';

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  accessToken?: string | null;
};

export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.accessToken
          ? { Authorization: `Bearer ${options.accessToken}` }
          : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const responseText = await response.text();

      try {
        const parsed = JSON.parse(responseText) as {
          message?: string | string[];
          error?: string;
        };
        const message = Array.isArray(parsed.message)
          ? parsed.message.join(', ')
          : parsed.message || parsed.error;

        throw new Error(message ? `${message}` : `HTTP ${response.status} for ${path}`);
      } catch {
        throw new Error(
          responseText.trim() || `HTTP ${response.status} for ${path}`,
        );
      }
    }

    return (await response.json()) as T;
  }
}
