const ADMIN_TOKEN_KEY = "admin_token";
const TOTEM_TOKEN_KEY = "auth_token";
const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const responseCache = new Map<string, CacheEntry>();
const inFlightGet = new Map<string, Promise<unknown>>();
let lastFetchFn: typeof fetch | null = null;

function syncFetchEnvironment(): void {
  if (lastFetchFn !== globalThis.fetch) {
    lastFetchFn = globalThis.fetch;
    responseCache.clear();
    inFlightGet.clear();
  }
}

export function invalidateApiCache(): void {
  responseCache.clear();
  inFlightGet.clear();
}

export function peekApiCache<T>(url: string): T | undefined {
  syncFetchEnvironment();
  const entry = responseCache.get(url);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(url);
    return undefined;
  }
  return entry.data as T;
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  invalidateApiCache();
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  invalidateApiCache();
}

export function getTotemToken(): string | null {
  return localStorage.getItem(TOTEM_TOKEN_KEY);
}

export function setTotemToken(token: string): void {
  localStorage.setItem(TOTEM_TOKEN_KEY, token);
  invalidateApiCache();
}

export function clearTotemToken(): void {
  localStorage.removeItem(TOTEM_TOKEN_KEY);
  invalidateApiCache();
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

export async function publicFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  return request<T>(url, options);
}

export async function apiUpload<T>(url: string, file: File): Promise<T> {
  syncFetchEnvironment();
  const token = getAdminToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      extractErrorMessage(body, response.status),
      response.status,
    );
  }

  invalidateApiCache();
  return response.json();
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

async function performRequest<T>(
  url: string,
  options: RequestInit,
  scheme?: "Bearer" | "Totem",
): Promise<T> {
  const token = scheme === "Totem" ? getTotemToken() : getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (scheme && token) {
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

async function request<T>(
  url: string,
  options: RequestInit,
  scheme?: "Bearer" | "Totem",
): Promise<T> {
  syncFetchEnvironment();
  const method = (options.method ?? "GET").toUpperCase();

  if (method !== "GET") {
    const result = await performRequest<T>(url, options, scheme);
    invalidateApiCache();
    return result;
  }

  const bypassCache =
    options.cache === "no-store" || options.cache === "reload";

  if (!bypassCache) {
    const cached = peekApiCache<T>(url);
    if (cached !== undefined) {
      return cached;
    }

    const existing = inFlightGet.get(url);
    if (existing) {
      return existing as Promise<T>;
    }
  }

  const promise = performRequest<T>(url, options, scheme)
    .then((data) => {
      if (!bypassCache) {
        responseCache.set(url, { data, timestamp: Date.now() });
      }
      return data;
    })
    .finally(() => {
      if (!bypassCache) {
        inFlightGet.delete(url);
      }
    });

  if (!bypassCache) {
    inFlightGet.set(url, promise);
  }
  return promise;
}

export function wsUrl(path: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}

export function wsUrlWithTotemToken(path: string, token: string): string {
  const url = wsUrl(path);
  return `${url}?token=${encodeURIComponent(token)}`;
}
