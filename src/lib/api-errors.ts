type ApiValidationErrors = Record<string, string[] | undefined>;

function firstValidationError(errors: ApiValidationErrors): string | null {
  for (const [field, messages] of Object.entries(errors)) {
    const firstMessage = messages?.find((item) => item && item.trim().length > 0);
    if (firstMessage) {
      return `${field}: ${firstMessage}`;
    }
  }

  return null;
}

export function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const maybeMessage = (payload as { message?: unknown }).message;
  if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
    return maybeMessage;
  }

  const maybeErrors = (payload as { errors?: unknown }).errors;
  if (maybeErrors && typeof maybeErrors === "object") {
    const message = firstValidationError(maybeErrors as ApiValidationErrors);
    if (message) {
      return `Datos inválidos: ${message}`;
    }
  }

  return fallback;
}
