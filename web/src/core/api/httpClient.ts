type HttpMethod = 'GET' | 'POST' | 'PATCH';

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  accessToken?: string | null;
};

export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.send(path, options);
    return (await response.json()) as T;
  }

  async requestBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
    const response = await this.send(path, options);
    return await response.blob();
  }

  private async send(path: string, options: RequestOptions = {}): Promise<Response> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.accessToken
            ? { Authorization: `Bearer ${options.accessToken}` }
            : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (error) {
      throw new Error(this.buildNetworkErrorMessage(path, error));
    }

    if (!response.ok) {
      let message = `HTTP ${response.status} for ${path}`;

      try {
        const errorPayload = (await response.json()) as {
          message?: string | string[];
          error?: string;
        };
        if (Array.isArray(errorPayload.message)) {
          message = errorPayload.message.join(', ');
        } else if (typeof errorPayload.message === 'string') {
          message = errorPayload.message;
        } else if (typeof errorPayload.error === 'string') {
          message = errorPayload.error;
        }
      } catch {
        // Keep the default message when the error body is not JSON.
      }

      throw new Error(message);
    }

    return response;
  }

  private buildNetworkErrorMessage(path: string, error: unknown) {
    const rawMessage = error instanceof Error ? error.message : String(error);

    if (path.includes('/manager/notifications/campaigns/')) {
      return `Cannot connect to backend reminder service. Check VITE_API_BASE_URL (${this.baseUrl}), backend port, and local CORS settings.`;
    }

    if (rawMessage.toLowerCase().includes('failed to fetch')) {
      return `Cannot connect to backend API at ${this.baseUrl}. Check that the backend is running and reachable from the browser.`;
    }

    return rawMessage;
  }
}
