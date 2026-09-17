interface PendingResponse {
  resolve: (response: string) => void;
  timeout: ReturnType<typeof setTimeout>;
}

const DEFAULT_TIMEOUT_MS = 30 * 1000;

const FALLBACK_RESPONSE =
  "The user did not respond within the time limit. Proceed using reasonable defaults and clearly state the assumptions you made.";

const pending = new Map<string, PendingResponse>();

export const waitForResponse = (
  correlationId: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string> => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      // Auto-resume: unblock the agent with a sensible default instead of
      // leaving the turn (and its SSE stream) hanging forever.
      pending.delete(correlationId);
      resolve(FALLBACK_RESPONSE);
    }, timeoutMs);

    pending.set(correlationId, { resolve, timeout });
  });
};

export const resolveResponse = (correlationId: string, response: string): void => {
  const pendingResponse = pending.get(correlationId);
  if (!pendingResponse) return;

  clearTimeout(pendingResponse.timeout);
  pending.delete(correlationId);
  pendingResponse.resolve(response);
};
