/**
 * Excecoes customizadas para a IPTU API.
 */

export interface ErrorDetails {
  error: string;
  message: string;
  statusCode?: number;
  requestId?: string;
  retryable: boolean;
  [key: string]: unknown;
}

/**
 * Excecao base para todos os erros da IPTU API.
 */
export class IPTUAPIError extends Error {
  public readonly statusCode?: number;
  public readonly requestId?: string;
  public readonly responseData: Record<string, unknown>;

  constructor(
    message: string,
    statusCode?: number,
    requestId?: string,
    responseData?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'IPTUAPIError';
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.responseData = responseData || {};
    Object.setPrototypeOf(this, IPTUAPIError.prototype);
  }

  isRetryable(): boolean {
    return false;
  }

  toJSON(): ErrorDetails {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      requestId: this.requestId,
      retryable: this.isRetryable(),
    };
  }
}

/**
 * Erro de autenticacao (401). API Key invalida ou ausente.
 */
export class AuthenticationError extends IPTUAPIError {
  constructor(message = 'API Key invalida ou ausente', requestId?: string) {
    super(message, 401, requestId);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Erro de autorizacao (403). Plano nao permite acesso ao recurso.
 */
export class ForbiddenError extends IPTUAPIError {
  public readonly requiredPlan?: string;

  constructor(
    message = 'Acesso negado',
    requiredPlan?: string,
    requestId?: string
  ) {
    super(message, 403, requestId);
    this.name = 'ForbiddenError';
    this.requiredPlan = requiredPlan;
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }

  toJSON(): ErrorDetails {
    return {
      ...super.toJSON(),
      requiredPlan: this.requiredPlan,
    };
  }
}

/**
 * Erro de recurso nao encontrado (404).
 */
export class NotFoundError extends IPTUAPIError {
  public readonly resource?: string;

  constructor(
    message = 'Recurso nao encontrado',
    resource?: string,
    requestId?: string
  ) {
    super(message, 404, requestId);
    this.name = 'NotFoundError';
    this.resource = resource;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  toJSON(): ErrorDetails {
    return {
      ...super.toJSON(),
      resource: this.resource,
    };
  }
}

/**
 * Erro de rate limit excedido (429).
 */
export class RateLimitError extends IPTUAPIError {
  public readonly retryAfter: number;

  constructor(
    message = 'Rate limit excedido',
    retryAfter = 60,
    requestId?: string
  ) {
    super(message, 429, requestId);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }

  isRetryable(): boolean {
    return true;
  }

  toJSON(): ErrorDetails {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Erro de validacao de parametros (400, 422).
 */
export class ValidationError extends IPTUAPIError {
  public readonly errors: Record<string, string[]>;

  constructor(
    message = 'Parametros invalidos',
    errors?: Record<string, string[]>,
    statusCode = 422,
    requestId?: string
  ) {
    super(message, statusCode, requestId);
    this.name = 'ValidationError';
    this.errors = errors || {};
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON(): ErrorDetails {
    return {
      ...super.toJSON(),
      validationErrors: this.errors,
    };
  }
}

/**
 * Erro interno do servidor (5xx). Retryable.
 */
export class ServerError extends IPTUAPIError {
  constructor(
    message = 'Erro interno do servidor',
    statusCode = 500,
    requestId?: string
  ) {
    super(message, statusCode, requestId);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }

  isRetryable(): boolean {
    return true;
  }
}

/**
 * Erro de timeout na requisicao.
 */
export class TimeoutError extends IPTUAPIError {
  public readonly timeoutSeconds?: number;

  constructor(
    message = 'Timeout na requisicao',
    timeoutSeconds?: number,
    requestId?: string
  ) {
    super(message, 408, requestId);
    this.name = 'TimeoutError';
    this.timeoutSeconds = timeoutSeconds;
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }

  isRetryable(): boolean {
    return true;
  }

  toJSON(): ErrorDetails {
    return {
      ...super.toJSON(),
      timeoutSeconds: this.timeoutSeconds,
    };
  }
}

/**
 * Erro de conexao de rede.
 */
export class NetworkError extends IPTUAPIError {
  public readonly originalError?: Error;

  constructor(message = 'Erro de conexao', originalError?: Error) {
    super(message, undefined, undefined);
    this.name = 'NetworkError';
    this.originalError = originalError;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }

  isRetryable(): boolean {
    return true;
  }
}
