const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** statusCode usado quando a requisição nem chegou ao servidor. */
export const NETWORK_ERROR_STATUS = 0;

export class ApiError extends Error {
  readonly statusCode: number;
  /** Erros por campo, no formato aceito pelo React Hook Form ("address.city"). */
  readonly fieldErrors: Record<string, string>;

  constructor(
    statusCode: number,
    message: string,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }

  get isNetworkError(): boolean {
    return this.statusCode === NETWORK_ERROR_STATUS;
  }
}

interface ApiErrorBody {
  message?: string | string[];
  /** Issues do Zod repassadas pelo nestjs-zod. */
  errors?: Array<{ path?: Array<string | number>; message?: string }>;
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw cause;
    }
    throw new ApiError(
      NETWORK_ERROR_STATUS,
      "Não foi possível falar com o servidor.",
    );
  }

  if (!response.ok) {
    throw await buildApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function buildApiError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => ({}) as ApiErrorBody);
  const { message, errors } = body as ApiErrorBody;

  const fieldErrors: Record<string, string> = {};
  for (const issue of errors ?? []) {
    const field = (issue.path ?? []).join(".");
    if (field && issue.message && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  const text = Array.isArray(message) ? message.join(", ") : message;

  return new ApiError(
    response.status,
    text || "Não foi possível completar a operação.",
    fieldErrors,
  );
}
