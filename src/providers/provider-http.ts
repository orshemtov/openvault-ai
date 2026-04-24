import { requestUrl } from "obsidian";

export async function getJson<T>(
  url: string,
  headers: Record<string, string> = {}
): Promise<T> {
  const response = await requestUrl({
    url,
    method: "GET",
    headers,
    throw: false
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}: ${response.text}`);
  }

  return response.json as T;
}

export async function postJson<TResponse>(
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<TResponse> {
  const response = await requestUrl({
    url,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(body),
    throw: false
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}: ${response.text}`);
  }

  return response.json as TResponse;
}

export async function postStream(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(body),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Streaming response body is not available.");
  }

  const decoder = new TextDecoder();
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    if (!chunk) {
      continue;
    }

    accumulated += chunk;
    onChunk(chunk);
  }

  const flush = decoder.decode();
  if (flush) {
    accumulated += flush;
    onChunk(flush);
  }

  return accumulated;
}
