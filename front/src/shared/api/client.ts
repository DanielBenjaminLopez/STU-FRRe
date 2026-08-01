const ADMIN_TOKEN_KEY = "admin_token";
const TOTEM_TOKEN_KEY = "auth_token";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getTotemToken(): string | null {
  return localStorage.getItem(TOTEM_TOKEN_KEY);
}

export function setTotemToken(token: string): void {
  localStorage.setItem(TOTEM_TOKEN_KEY, token);
}

export function clearTotemToken(): void {
  localStorage.removeItem(TOTEM_TOKEN_KEY);
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  return request<T>(url, options, "Bearer");
}

export async function totemFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  return request<T>(url, options, "Totem");
}

function firstMessage(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const msg = firstMessage(item);
      if (msg) return msg;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const msg = firstMessage(item);
      if (msg) return msg;
    }
  }
  return null;
}

function extractErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const error = body as Record<string, unknown>;

    const detail = firstMessage(error.detail);
    if (detail) return detail;

    const message = firstMessage(error.message);
    if (message) return message;

    for (const value of Object.values(error)) {
      const msg = firstMessage(value);
      if (msg) return msg;
    }
  }
  return `Error ${status}`;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  url: string,
  options: RequestInit,
  scheme: "Bearer" | "Totem",
): Promise<T> {
  const token = scheme === "Totem" ? getTotemToken() : getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `${scheme} ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      extractErrorMessage(body, response.status),
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export function wsUrl(path: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}
