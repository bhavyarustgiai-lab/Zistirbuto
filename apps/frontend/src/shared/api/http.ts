import { env } from "@shared/config/env";

export class ApiError extends Error {
  status: number;
  fieldErrors: Array<{ field: string; message: string }>;

  constructor(message: string, status: number, fieldErrors: Array<{ field: string; message: string }> = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init
  });

  if (!response.ok) {
    let message = `API error ${response.status}`;
    let fieldErrors: Array<{ field: string; message: string }> = [];
    try {
      const data = (await response.json()) as { error?: string; fieldErrors?: Array<{ field: string; message: string }> };
      if (data?.error) {
        message = data.error;
      }
      if (Array.isArray(data?.fieldErrors)) {
        fieldErrors = data.fieldErrors;
      }
    } catch {
      // Keep the HTTP status message when the response body is not JSON.
    }
    throw new ApiError(message, response.status, fieldErrors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
