/**
 * IPTU API - JavaScript/TypeScript SDK
 *
 * SDK oficial para integração com a IPTU API.
 * Suporta retry automático, logging e rate limit tracking.
 *
 * @example
 * ```typescript
 * import { IPTUClient } from 'iptuapi';
 *
 * const client = new IPTUClient('sua_api_key');
 * const resultado = await client.consultaEndereco('Avenida Paulista', '1000');
 * console.log(resultado);
 * ```
 *
 * @example
 * ```typescript
 * // Com configuração customizada
 * const client = new IPTUClient('sua_api_key', {
 *   timeout: 60000,
 *   retries: 5,
 *   logger: console,
 * });
 * ```
 */

// =============================================================================
// Types and Enums
// =============================================================================

export type Cidade = 'sp' | 'bh' | 'recife' | 'poa' | 'fortaleza' | 'curitiba' | 'rj' | 'brasilia';

export const CidadeEnum = {
  SAO_PAULO: 'sp' as Cidade,
  BELO_HORIZONTE: 'bh' as Cidade,
  RECIFE: 'recife' as Cidade,
  PORTO_ALEGRE: 'poa' as Cidade,
  FORTALEZA: 'fortaleza' as Cidade,
  CURITIBA: 'curitiba' as Cidade,
  RIO_DE_JANEIRO: 'rj' as Cidade,
  BRASILIA: 'brasilia' as Cidade,
} as const;

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  resetDate: Date;
}

export interface ConsultaEnderecoParams {
  logradouro: string;
  numero?: string;
  complemento?: string;
  cidade?: Cidade;
  incluirHistorico?: boolean;
  incluirComparaveis?: boolean;
  incluirZoneamento?: boolean;
}

export interface ConsultaEnderecoResult {
  sql: string;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  area_terreno?: number;
  area_construida?: number;
  valor_venal_terreno?: number;
  valor_venal_construcao?: number;
  valor_venal_total?: number;
  iptu_valor?: number;
  ano_construcao?: number;
  tipo_uso?: string;
  zona?: string;
  historico?: HistoricoItem[];
  comparaveis?: ComparavelItem[];
  zoneamento?: ZoneamentoResult;
}

export interface ConsultaSQLResult {
  sql: string;
  ano?: number;
  valor_venal?: number;
  valor_venal_terreno?: number;
  valor_venal_construcao?: number;
  valor_venal_total?: number;
  iptu_valor?: number;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  area_terreno?: number;
  area_construida?: number;
}

export interface HistoricoItem {
  ano: number;
  valor_venal_terreno?: number;
  valor_venal_construcao?: number;
  valor_venal_total?: number;
  iptu_valor?: number;
}

export interface ComparavelItem {
  sql?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  area_terreno?: number;
  area_construida?: number;
  valor_venal_total?: number;
  distancia_metros?: number;
}

export interface ZoneamentoResult {
  zona?: string;
  zona_descricao?: string;
  coeficiente_aproveitamento_basico?: number;
  coeficiente_aproveitamento_maximo?: number;
  taxa_ocupacao_maxima?: number;
  gabarito_maximo?: number;
}

export interface ValuationParams {
  area_terreno: number;
  area_construida: number;
  bairro: string;
  zona: string;
  tipo_uso: string;
  tipo_padrao: string;
  ano_construcao?: number;
  cidade?: Cidade;
}

export interface ValuationResult {
  valor_estimado: number;
  valor_minimo?: number;
  valor_maximo?: number;
  confianca?: number;
  metodo?: string;
  comparaveis_utilizados?: number;
  data_avaliacao?: string;
}

export interface BatchValuationResult {
  resultados: ValuationResult[];
  total_processados: number;
  total_erros: number;
  erros?: Array<{ index: number; error: string }>;
}

// =============================================================================
// Exceptions
// =============================================================================

export class IPTUAPIError extends Error {
  public readonly statusCode?: number;
  public readonly requestId?: string;
  public readonly responseBody?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode?: number,
    requestId?: string,
    responseBody?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'IPTUAPIError';
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.responseBody = responseBody;
    Object.setPrototypeOf(this, IPTUAPIError.prototype);
  }

  get isRetryable(): boolean {
    return this.statusCode
      ? [429, 500, 502, 503, 504].includes(this.statusCode)
      : false;
  }
}

export class AuthenticationError extends IPTUAPIError {
  constructor(
    message = 'API Key inválida ou expirada',
    requestId?: string,
    responseBody?: Record<string, unknown>
  ) {
    super(message, 401, requestId, responseBody);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class ForbiddenError extends IPTUAPIError {
  public readonly requiredPlan?: string;

  constructor(
    message = 'Plano não autorizado para este recurso',
    requiredPlan?: string,
    requestId?: string,
    responseBody?: Record<string, unknown>
  ) {
    super(message, 403, requestId, responseBody);
    this.name = 'ForbiddenError';
    this.requiredPlan = requiredPlan;
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends IPTUAPIError {
  constructor(
    message = 'Recurso não encontrado',
    requestId?: string,
    responseBody?: Record<string, unknown>
  ) {
    super(message, 404, requestId, responseBody);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class RateLimitError extends IPTUAPIError {
  public readonly retryAfter?: number;
  public readonly limit?: number;
  public readonly remaining?: number;

  constructor(
    message = 'Limite de requisições excedido',
    retryAfter?: number,
    limit?: number,
    remaining?: number,
    requestId?: string,
    responseBody?: Record<string, unknown>
  ) {
    super(message, 429, requestId, responseBody);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }

  override get isRetryable(): boolean {
    return true;
  }
}

export class ValidationError extends IPTUAPIError {
  public readonly errors?: Array<{ field: string; message: string }>;

  constructor(
    message = 'Parâmetros inválidos',
    errors?: Array<{ field: string; message: string }>,
    requestId?: string,
    responseBody?: Record<string, unknown>
  ) {
    super(message, 400, requestId, responseBody);
    this.name = 'ValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class ServerError extends IPTUAPIError {
  constructor(
    message = 'Erro interno do servidor',
    statusCode = 500,
    requestId?: string,
    responseBody?: Record<string, unknown>
  ) {
    super(message, statusCode, requestId, responseBody);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }

  override get isRetryable(): boolean {
    return true;
  }
}

export class TimeoutError extends IPTUAPIError {
  public readonly timeoutMs?: number;

  constructor(message = 'Timeout na requisição', timeoutMs?: number) {
    super(message, 408);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }

  override get isRetryable(): boolean {
    return true;
  }
}

export class NetworkError extends IPTUAPIError {
  public readonly originalError?: Error;

  constructor(message = 'Erro de conexão com a API', originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }

  override get isRetryable(): boolean {
    return true;
  }
}

// =============================================================================
// Logger Interface
// =============================================================================

export interface Logger {
  debug?(message: string, ...args: unknown[]): void;
  info?(message: string, ...args: unknown[]): void;
  warn?(message: string, ...args: unknown[]): void;
  error?(message: string, ...args: unknown[]): void;
}

// =============================================================================
// Retry Configuration
// =============================================================================

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Initial delay in ms between retries (default: 500) */
  initialDelay: number;
  /** Maximum delay in ms between retries (default: 10000) */
  maxDelay: number;
  /** Backoff factor (default: 2) */
  backoffFactor: number;
  /** Status codes that trigger retry (default: [429, 500, 502, 503, 504]) */
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableStatuses: [429, 500, 502, 503, 504],
};

// =============================================================================
// Client Options
// =============================================================================

export interface IPTUClientOptions {
  /** Base URL for the API (default: https://iptuapi.com.br/api/v1) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Retry configuration */
  retry?: Partial<RetryConfig>;
  /** Logger instance for debugging */
  logger?: Logger;
  /** Enable request logging (default: false) */
  logRequests?: boolean;
  /** Enable response logging (default: false) */
  logResponses?: boolean;
  /** Custom User-Agent header */
  userAgent?: string;
}

export interface RequestOptions {
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
  /** Override timeout for this specific request (in milliseconds) */
  timeout?: number;
}

// =============================================================================
// IPTU Client
// =============================================================================

export class IPTUClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryConfig: RetryConfig;
  private readonly logger?: Logger;
  private readonly logRequests: boolean;
  private readonly logResponses: boolean;
  private readonly userAgent: string;

  private _rateLimit?: RateLimitInfo;
  private _lastRequestId?: string;

  constructor(apiKey: string, options: IPTUClientOptions = {}) {
    if (!apiKey) {
      throw new Error('API Key é obrigatória');
    }

    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://iptuapi.com.br/api/v1';
    this.timeout = options.timeout || 30000;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...options.retry };
    this.logger = options.logger;
    this.logRequests = options.logRequests || false;
    this.logResponses = options.logResponses || false;
    this.userAgent = options.userAgent || 'iptuapi-js/2.1.0';
  }

  // ===========================================================================
  // Properties
  // ===========================================================================

  /** Rate limit info from last request */
  get rateLimit(): RateLimitInfo | undefined {
    return this._rateLimit;
  }

  /** Request ID from last request (useful for support) */
  get lastRequestId(): string | undefined {
    return this._lastRequestId;
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    ...args: unknown[]
  ): void {
    if (this.logger && this.logger[level]) {
      this.logger[level]!(message, ...args);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private combineSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
    const controller = new AbortController();

    const abort = () => controller.abort();

    if (signal1.aborted || signal2.aborted) {
      controller.abort();
      return controller.signal;
    }

    signal1.addEventListener('abort', abort, { once: true });
    signal2.addEventListener('abort', abort, { once: true });

    return controller.signal;
  }

  private calculateDelay(attempt: number): number {
    const delay =
      this.retryConfig.initialDelay *
      Math.pow(this.retryConfig.backoffFactor, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private extractRateLimit(headers: Headers): RateLimitInfo | undefined {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');

    if (limit && remaining && reset) {
      const resetTimestamp = parseInt(reset, 10);
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: resetTimestamp,
        resetDate: new Date(resetTimestamp * 1000),
      };
    }
    return undefined;
  }

  private async handleErrorResponse(
    response: Response,
    requestId?: string
  ): Promise<never> {
    let body: Record<string, unknown> = {};
    try {
      body = await response.json();
    } catch {
      body = { detail: response.statusText };
    }

    // Handle detail being an object (e.g., {"success": false, "error": "...", "detail": "..."})
    let message: string;
    const detail = body.detail;
    if (detail && typeof detail === 'object') {
      const detailObj = detail as Record<string, unknown>;
      message = (detailObj.error as string) || (detailObj.detail as string) || (detailObj.message as string) || JSON.stringify(detail);
    } else {
      message = (detail as string) || `HTTP ${response.status}`;
    }

    switch (response.status) {
      case 400:
      case 422:
        throw new ValidationError(
          message,
          body.errors as Array<{ field: string; message: string }>,
          requestId,
          body
        );
      case 401:
        throw new AuthenticationError(message, requestId, body);
      case 403:
        throw new ForbiddenError(
          message,
          body.required_plan as string,
          requestId,
          body
        );
      case 404:
        throw new NotFoundError(message, requestId, body);
      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(
          message,
          retryAfter ? parseInt(retryAfter, 10) : undefined,
          this._rateLimit?.limit,
          this._rateLimit?.remaining,
          requestId,
          body
        );
      case 500:
      case 502:
      case 503:
      case 504:
        throw new ServerError(message, response.status, requestId, body);
      default:
        throw new IPTUAPIError(message, response.status, requestId, body);
    }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: object,
    options?: RequestOptions
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': this.userAgent,
    };

    const requestTimeout = options?.timeout ?? this.timeout;
    const externalSignal = options?.signal;

    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt <= this.retryConfig.maxRetries) {
      if (externalSignal?.aborted) {
        throw new IPTUAPIError('Request aborted', undefined, undefined, undefined);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

      const combinedSignal = externalSignal
        ? this.combineSignals(externalSignal, controller.signal)
        : controller.signal;

      try {
        if (this.logRequests) {
          this.log(
            'debug',
            `Request: ${method} ${url}`,
            params ? { params } : {},
            body ? { body } : {}
          );
        }

        const startTime = Date.now();

        const response = await fetch(url.toString(), {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: combinedSignal,
        });

        clearTimeout(timeoutId);

        const elapsedMs = Date.now() - startTime;

        // Extract rate limit and request ID
        this._rateLimit = this.extractRateLimit(response.headers);
        this._lastRequestId =
          response.headers.get('X-Request-ID') || undefined;

        if (this.logResponses) {
          this.log(
            'debug',
            `Response: ${response.status} ${url} (${elapsedMs}ms)`
          );
        }

        if (response.ok) {
          return (await response.json()) as T;
        }

        // Handle error responses
        if (
          this.retryConfig.retryableStatuses.includes(response.status) &&
          attempt < this.retryConfig.maxRetries
        ) {
          const delay = this.calculateDelay(attempt);
          this.log(
            'warn',
            `Request failed with ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`
          );
          await this.sleep(delay);
          attempt++;
          continue;
        }

        await this.handleErrorResponse(response, this._lastRequestId);
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof IPTUAPIError) {
          throw error;
        }

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = new TimeoutError(
              `Timeout após ${this.timeout}ms`,
              this.timeout
            );
          } else if (
            error.message.includes('fetch') ||
            error.message.includes('network')
          ) {
            lastError = new NetworkError(
              `Erro de conexão: ${error.message}`,
              error
            );
          } else {
            lastError = error;
          }

          // Retry on network/timeout errors
          if (attempt < this.retryConfig.maxRetries) {
            const delay = this.calculateDelay(attempt);
            this.log(
              'warn',
              `Request failed: ${error.message}, retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`
            );
            await this.sleep(delay);
            attempt++;
            continue;
          }
        }

        throw lastError || error;
      }
    }

    throw lastError || new IPTUAPIError('Max retries exceeded');
  }

  // ===========================================================================
  // Consulta Endpoints
  // ===========================================================================

  /**
   * Busca dados de IPTU por endereço.
   *
   * @param params - Parâmetros da consulta
   * @param options - Opções de request (signal para cancelamento, timeout)
   * @returns Dados do imóvel encontrado
   * @throws {NotFoundError} Se o imóvel não for encontrado
   * @throws {ValidationError} Se os parâmetros forem inválidos
   * @throws {AuthenticationError} Se a API Key for inválida
   * @throws {RateLimitError} Se exceder o limite de requisições
   */
  async consultaEndereco(
    params: ConsultaEnderecoParams,
    options?: RequestOptions
  ): Promise<ConsultaEnderecoResult>;
  async consultaEndereco(
    logradouro: string,
    numero?: string,
    cidade?: Cidade,
    options?: RequestOptions
  ): Promise<ConsultaEnderecoResult>;
  async consultaEndereco(
    paramsOrLogradouro: ConsultaEnderecoParams | string,
    numeroOrOptions?: string | RequestOptions,
    cidade?: Cidade,
    options?: RequestOptions
  ): Promise<ConsultaEnderecoResult> {
    let params: Record<string, string | boolean | undefined>;
    let requestOptions: RequestOptions | undefined;

    if (typeof paramsOrLogradouro === 'string') {
      const numero = typeof numeroOrOptions === 'string' ? numeroOrOptions : undefined;
      requestOptions = typeof numeroOrOptions === 'object' ? numeroOrOptions : options;
      params = {
        logradouro: paramsOrLogradouro,
        numero,
        cidade: cidade || 'sp',
      };
    } else {
      requestOptions = numeroOrOptions as RequestOptions | undefined;
      params = {
        logradouro: paramsOrLogradouro.logradouro,
        numero: paramsOrLogradouro.numero,
        complemento: paramsOrLogradouro.complemento,
        cidade: paramsOrLogradouro.cidade || 'sp',
        incluir_historico: paramsOrLogradouro.incluirHistorico,
        incluir_comparaveis: paramsOrLogradouro.incluirComparaveis,
        incluir_zoneamento: paramsOrLogradouro.incluirZoneamento,
      };
    }

    return this.request<ConsultaEnderecoResult>(
      'GET',
      '/consulta/endereco',
      params,
      undefined,
      requestOptions
    );
  }

  /**
   * Busca dados de IPTU por número SQL (contribuinte).
   *
   * @param sql - Número SQL do imóvel
   * @param cidade - Cidade da consulta
   * @param options - Opções adicionais (incluirHistorico, incluirComparaveis)
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Dados completos do imóvel
   */
  async consultaSQL(
    sql: string,
    cidade: Cidade = 'sp',
    options?: { incluirHistorico?: boolean; incluirComparaveis?: boolean },
    requestOptions?: RequestOptions
  ): Promise<ConsultaSQLResult> {
    return this.request<ConsultaSQLResult>('GET', `/consulta/sql/${sql}`, {
      cidade,
      incluir_historico: options?.incluirHistorico,
      incluir_comparaveis: options?.incluirComparaveis,
    }, undefined, requestOptions);
  }

  /**
   * Busca imóveis por CEP.
   *
   * @param cep - CEP do imóvel
   * @param cidade - Cidade da consulta
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Lista de imóveis no CEP
   */
  async consultaCEP(
    cep: string,
    cidade: Cidade = 'sp',
    requestOptions?: RequestOptions
  ): Promise<ConsultaEnderecoResult[]> {
    const cleanCep = cep.replace(/\D/g, '');
    return this.request<ConsultaEnderecoResult[]>(
      'GET',
      `/consulta/cep/${cleanCep}`,
      { cidade },
      undefined,
      requestOptions
    );
  }

  /**
   * Consulta zoneamento por coordenadas.
   *
   * @param latitude - Latitude do ponto
   * @param longitude - Longitude do ponto
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Dados de zoneamento
   */
  async consultaZoneamento(
    latitude: number,
    longitude: number,
    requestOptions?: RequestOptions
  ): Promise<ZoneamentoResult> {
    return this.request<ZoneamentoResult>('GET', '/consulta/zoneamento', {
      latitude,
      longitude,
    }, undefined, requestOptions);
  }

  // ===========================================================================
  // Valuation Endpoints (Pro+)
  // ===========================================================================

  /**
   * Estima o valor de mercado do imóvel usando ML.
   * Disponível apenas para planos Pro e Enterprise.
   *
   * @param params - Parâmetros do imóvel
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Estimativa de valor
   * @throws {ForbiddenError} Se o plano não permitir
   */
  async valuationEstimate(params: ValuationParams, requestOptions?: RequestOptions): Promise<ValuationResult> {
    return this.request<ValuationResult>(
      'POST',
      '/valuation/estimate',
      undefined,
      {
        area_terreno: params.area_terreno,
        area_construida: params.area_construida,
        bairro: params.bairro,
        zona: params.zona,
        tipo_uso: params.tipo_uso,
        tipo_padrao: params.tipo_padrao,
        ano_construcao: params.ano_construcao,
        cidade: params.cidade || 'sp',
      },
      requestOptions
    );
  }

  /**
   * Valuation em lote (até 100 imóveis).
   * Disponível apenas para plano Enterprise.
   *
   * @param imoveis - Lista de imóveis para avaliar
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Resultados de valuation para cada imóvel
   */
  async valuationBatch(
    imoveis: ValuationParams[],
    requestOptions?: RequestOptions
  ): Promise<BatchValuationResult> {
    return this.request<BatchValuationResult>(
      'POST',
      '/valuation/estimate/batch',
      undefined,
      { imoveis },
      requestOptions
    );
  }

  /**
   * Busca imóveis comparáveis para análise.
   *
   * @param bairro - Nome do bairro
   * @param areaMin - Área mínima em m²
   * @param areaMax - Área máxima em m²
   * @param options - Opções adicionais
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Lista de imóveis comparáveis
   */
  async valuationComparables(
    bairro: string,
    areaMin: number,
    areaMax: number,
    options?: { tipoUso?: string; cidade?: Cidade; limit?: number },
    requestOptions?: RequestOptions
  ): Promise<ComparavelItem[]> {
    return this.request<ComparavelItem[]>('GET', '/valuation/comparables', {
      bairro,
      area_min: areaMin,
      area_max: areaMax,
      tipo_uso: options?.tipoUso,
      cidade: options?.cidade || 'sp',
      limit: options?.limit || 10,
    }, undefined, requestOptions);
  }

  /**
   * Estatísticas de valores por bairro.
   *
   * @param bairro - Nome do bairro
   * @param cidade - Cidade da consulta
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Estatísticas: média, mediana, min, max, etc
   */
  async valuationStatistics(
    bairro: string,
    cidade: Cidade = 'sp',
    requestOptions?: RequestOptions
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      'GET',
      `/valuation/statistics/${encodeURIComponent(bairro)}`,
      { cidade },
      undefined,
      requestOptions
    );
  }

  // ===========================================================================
  // Dados Endpoints
  // ===========================================================================

  /**
   * Histórico de valores IPTU de um imóvel.
   *
   * @param sql - Número SQL do imóvel
   * @param cidade - Cidade da consulta
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Lista com histórico anual
   */
  async dadosIPTUHistorico(
    sql: string,
    cidade: Cidade = 'sp',
    requestOptions?: RequestOptions
  ): Promise<HistoricoItem[]> {
    return this.request<HistoricoItem[]>(
      'GET',
      `/dados/iptu/historico/${sql}`,
      { cidade },
      undefined,
      requestOptions
    );
  }

  /**
   * Consulta dados de empresa por CNPJ.
   *
   * @param cnpj - CNPJ da empresa
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Dados cadastrais
   */
  async dadosCNPJ(cnpj: string, requestOptions?: RequestOptions): Promise<Record<string, unknown>> {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    return this.request<Record<string, unknown>>(
      'GET',
      `/dados/cnpj/${cleanCnpj}`,
      undefined,
      undefined,
      requestOptions
    );
  }

  /**
   * Índice IPCA histórico.
   *
   * @param dataInicio - Data inicial (YYYY-MM)
   * @param dataFim - Data final (YYYY-MM)
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Série histórica do IPCA
   */
  async dadosIPCA(
    dataInicio?: string,
    dataFim?: string,
    requestOptions?: RequestOptions
  ): Promise<Array<Record<string, unknown>>> {
    return this.request<Array<Record<string, unknown>>>(
      'GET',
      '/dados/ipca',
      {
        data_inicio: dataInicio,
        data_fim: dataFim,
      },
      undefined,
      requestOptions
    );
  }

  /**
   * Correção monetária pelo IPCA.
   *
   * @param valor - Valor a corrigir
   * @param dataOrigem - Data do valor original (YYYY-MM)
   * @param dataDestino - Data destino (default: atual)
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Valor corrigido e fator de correção
   */
  async dadosIPCACorrigir(
    valor: number,
    dataOrigem: string,
    dataDestino?: string,
    requestOptions?: RequestOptions
  ): Promise<{ valor_corrigido: number; fator: number }> {
    return this.request<{ valor_corrigido: number; fator: number }>(
      'GET',
      '/dados/ipca/corrigir',
      {
        valor,
        data_origem: dataOrigem,
        data_destino: dataDestino,
      },
      undefined,
      requestOptions
    );
  }

  // ===========================================================================
  // IPTU Tools Endpoints (Ferramentas IPTU 2026)
  // ===========================================================================

  /**
   * Lista todas as cidades com calendario de IPTU disponivel.
   *
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Lista de cidades com codigo, nome, desconto e parcelas
   */
  async iptuToolsCidades(requestOptions?: RequestOptions): Promise<{
    cidades: Array<{
      codigo: string;
      nome: string;
      ano: number;
      desconto_vista: string;
      parcelas_max: number;
      site_oficial: string;
    }>;
    total: number;
  }> {
    return this.request("GET", "/iptu-tools/cidades", undefined, undefined, requestOptions);
  }

  /**
   * Retorna o calendario completo de IPTU para a cidade especificada.
   *
   * @param cidade - Codigo da cidade (sp, bh, rj, recife, curitiba, poa, fortaleza)
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Calendario com vencimentos, descontos, alertas e novidades
   */
  async iptuToolsCalendario(
    cidade: Cidade = "sp",
    requestOptions?: RequestOptions
  ): Promise<{
    cidade: string;
    ano: number;
    desconto_vista_percentual: number;
    desconto_vista_texto: string;
    parcelas_max: number;
    valor_minimo_parcela: number;
    isencao_valor_venal?: number;
    isencao_texto?: string;
    site_oficial: string;
    novidades?: string[];
    alertas?: string[];
    formas_pagamento?: string[];
    vencimentos_cota_unica: string[];
    vencimentos_parcelado: string[];
    proximo_vencimento?: string;
    dias_para_proximo_vencimento?: number;
  }> {
    return this.request("GET", "/iptu-tools/calendario", { cidade }, undefined, requestOptions);
  }

  /**
   * Simula as opcoes de pagamento do IPTU (a vista vs parcelado).
   *
   * @param valorIptu - Valor total do IPTU
   * @param cidade - Codigo da cidade
   * @param valorVenal - Valor venal do imovel (para verificar isencao)
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Comparativo entre pagamento a vista e parcelado com recomendacao
   */
  async iptuToolsSimulador(
    valorIptu: number,
    cidade: Cidade = "sp",
    valorVenal?: number,
    requestOptions?: RequestOptions
  ): Promise<{
    valor_original: number;
    valor_vista: number;
    desconto_vista: number;
    desconto_percentual: number;
    parcelas: number;
    valor_parcela: number;
    valor_total_parcelado: number;
    economia_vista: number;
    economia_percentual: number;
    recomendacao: string;
    elegivel_isencao: boolean;
    isencao_mensagem?: string;
    cidade: string;
    ano: number;
    proximo_vencimento?: string;
  }> {
    const body: Record<string, unknown> = {
      valor_iptu: valorIptu,
      cidade,
    };
    if (valorVenal !== undefined) {
      body.valor_venal = valorVenal;
    }
    return this.request("POST", "/iptu-tools/simulador", undefined, body, requestOptions);
  }

  /**
   * Verifica se um imovel e elegivel para isencao de IPTU.
   *
   * @param valorVenal - Valor venal do imovel
   * @param cidade - Codigo da cidade
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Elegibilidade para isencao total ou parcial
   */
  async iptuToolsIsencao(
    valorVenal: number,
    cidade: Cidade = "sp",
    requestOptions?: RequestOptions
  ): Promise<{
    cidade: string;
    valor_venal: number;
    limite_isencao: number;
    elegivel_isencao_total: boolean;
    elegivel_desconto_parcial: boolean;
    desconto_estimado_percentual?: number;
    mensagem: string;
    requisitos_adicionais: string[];
  }> {
    return this.request("GET", "/iptu-tools/isencao", {
      valor_venal: valorVenal,
      cidade,
    }, undefined, requestOptions);
  }

  /**
   * Retorna informacoes sobre o proximo vencimento do IPTU.
   *
   * @param cidade - Codigo da cidade
   * @param parcela - Numero da parcela (1-12)
   * @param requestOptions - Opções de request (signal para cancelamento, timeout)
   * @returns Data de vencimento, dias restantes e status
   */
  async iptuToolsProximoVencimento(
    cidade: Cidade = "sp",
    parcela: number = 1,
    requestOptions?: RequestOptions
  ): Promise<{
    cidade: string;
    data_vencimento: string;
    dias_restantes: number;
    status: "em_dia" | "proximo" | "vence_hoje" | "vencido";
    mensagem: string;
    multa_estimada?: number;
    juros_estimados?: number;
  }> {
    return this.request("GET", "/iptu-tools/proximo-vencimento", {
      cidade,
      parcela,
    }, undefined, requestOptions);
  }
}

// =============================================================================
// Default Export
// =============================================================================

export default IPTUClient;
