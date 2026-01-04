/**
 * Cliente principal para a IPTU API.
 */

import {
  IPTUAPIError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  ServerError,
  TimeoutError,
  NetworkError,
} from './errors';

import type {
  ClientConfig,
  ClientOptions,
  RetryConfig,
  RateLimitInfo,
  Imovel,
  Zoneamento,
  Valuation,
  ValuationParams,
  Comparavel,
  ComparablesParams,
  EvaluateParams,
  PropertyEvaluation,
  ITBIStatus,
  ITBICalculo,
  ITBICalculoParams,
  ITBIHistorico,
  ITBIAliquota,
  ITBIIsencao,
  ITBIGuiaParams,
  ITBIGuia,
  ITBIValidacao,
  ITBISimularParams,
  ITBISimulacao,
  Cidade,
} from './types';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2.0,
  retryableStatusCodes: [429, 500, 502, 503, 504],
};

const DEFAULT_CONFIG: ClientConfig = {
  baseUrl: 'https://iptuapi.com.br/api/v1',
  timeout: 30000,
  retryConfig: DEFAULT_RETRY_CONFIG,
};

/**
 * Converte snake_case para camelCase.
 */
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? toCamelCase(item as Record<string, unknown>)
          : item
      );
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

/**
 * Converte camelCase para snake_case.
 */
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = toSnakeCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? toSnakeCase(item as Record<string, unknown>)
          : item
      );
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
}

/**
 * Cliente para interagir com a IPTU API.
 */
export class IPTUClient {
  private readonly apiKey: string;
  private readonly config: ClientConfig;
  private _rateLimitInfo: RateLimitInfo | null = null;
  private _lastRequestId: string | null = null;

  /**
   * Cria uma nova instancia do cliente.
   *
   * @param apiKey - Chave de API para autenticacao
   * @param options - Opcoes de configuracao
   */
  constructor(apiKey: string, options?: ClientOptions) {
    this.apiKey = apiKey;
    this.config = {
      baseUrl: options?.baseUrl || DEFAULT_CONFIG.baseUrl,
      timeout: options?.timeout || DEFAULT_CONFIG.timeout,
      retryConfig: {
        ...DEFAULT_RETRY_CONFIG,
        ...options?.retryConfig,
      },
    };
  }

  /**
   * Retorna informacoes do rate limit da ultima requisicao.
   */
  get rateLimitInfo(): RateLimitInfo | null {
    return this._rateLimitInfo;
  }

  /**
   * Retorna o ID da ultima requisicao.
   */
  get lastRequestId(): string | null {
    return this._lastRequestId;
  }

  /**
   * Executa uma requisicao HTTP com retry.
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    params?: Record<string, unknown>,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = new URL(`${this.config.baseUrl}/${endpoint.replace(/^\//, '')}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const { maxRetries, initialDelay, maxDelay, backoffFactor } =
      this.config.retryConfig;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      try {
        const response = await fetch(url.toString(), {
          method,
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'iptuapi-js/1.0.0',
          },
          body: body ? JSON.stringify(toSnakeCase(body)) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Atualiza rate limit info
        this.updateRateLimitInfo(response.headers);
        this._lastRequestId = response.headers.get('X-Request-ID');

        if (!response.ok) {
          await this.handleError(response);
        }

        const data = await response.json();
        return toCamelCase(data.data || data) as T;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof IPTUAPIError) {
          if (
            error.isRetryable() &&
            attempt < maxRetries &&
            this.config.retryConfig.retryableStatusCodes.includes(
              error.statusCode || 0
            )
          ) {
            await this.sleep(delay);
            delay = Math.min(delay * backoffFactor, maxDelay);
            continue;
          }
          throw error;
        }

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            if (attempt < maxRetries) {
              await this.sleep(delay);
              delay = Math.min(delay * backoffFactor, maxDelay);
              continue;
            }
            throw new TimeoutError(
              `Timeout apos ${this.config.timeout}ms`,
              this.config.timeout / 1000
            );
          }

          if (attempt < maxRetries) {
            await this.sleep(delay);
            delay = Math.min(delay * backoffFactor, maxDelay);
            continue;
          }
          throw new NetworkError(`Erro de conexao: ${error.message}`, error);
        }

        throw new NetworkError('Erro desconhecido');
      }
    }

    throw new NetworkError('Maximo de tentativas excedido');
  }

  /**
   * Atualiza informacoes de rate limit a partir dos headers.
   */
  private updateRateLimitInfo(headers: Headers): void {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');

    if (limit && remaining && reset) {
      this._rateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        resetAt: new Date(parseInt(reset, 10) * 1000),
      };
    }
  }

  /**
   * Converte resposta HTTP em excecao apropriada.
   */
  private async handleError(response: Response): Promise<never> {
    const requestId = response.headers.get('X-Request-ID') || undefined;
    let data: Record<string, unknown> = {};
    let message = 'Erro desconhecido';

    try {
      data = await response.json();
      message = (data.detail as string) || (data.message as string) || message;
    } catch {
      message = response.statusText || message;
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message, requestId);
      case 403:
        throw new ForbiddenError(
          message,
          data.required_plan as string | undefined,
          requestId
        );
      case 404:
        throw new NotFoundError(
          message,
          data.resource as string | undefined,
          requestId
        );
      case 429: {
        const retryAfter = parseInt(
          response.headers.get('Retry-After') || '60',
          10
        );
        throw new RateLimitError(message, retryAfter, requestId);
      }
      case 400:
      case 422:
        throw new ValidationError(
          message,
          data.errors as Record<string, string[]> | undefined,
          response.status,
          requestId
        );
      default:
        if (response.status >= 500) {
          throw new ServerError(message, response.status, requestId);
        }
        throw new IPTUAPIError(message, response.status, requestId, data);
    }
  }

  /**
   * Aguarda um tempo em milissegundos.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==================== CONSULTAS IPTU ====================

  /**
   * Consulta imoveis por endereco.
   *
   * @param logradouro - Nome da rua/avenida
   * @param numero - Numero do imovel
   * @param cidade - Codigo da cidade (sp, bh, recife)
   * @returns Lista de imoveis encontrados
   */
  async consultaEndereco(
    logradouro: string,
    numero: string,
    cidade: Cidade = 'sp'
  ): Promise<Imovel[]> {
    const response = await this.makeRequest<Imovel[]>('GET', '/consulta/endereco', {
      logradouro,
      numero,
      cidade,
    });
    return Array.isArray(response) ? response : [];
  }

  /**
   * Consulta imovel por numero SQL/Indice Cadastral.
   * Requer plano Starter ou superior.
   *
   * @param sql - Numero SQL (SP), Indice Cadastral (BH) ou Sequencial (Recife)
   * @param cidade - Codigo da cidade (sp, bh, recife)
   * @returns Lista de imoveis encontrados
   */
  async consultaSQL(sql: string, cidade: Cidade = 'sp'): Promise<Imovel[]> {
    const response = await this.makeRequest<Imovel[]>('GET', '/consulta/sql', {
      sql,
      cidade,
    });
    return Array.isArray(response) ? response : [];
  }

  /**
   * Consulta imoveis por CEP.
   *
   * @param cep - CEP do endereco
   * @param cidade - Codigo da cidade (sp, bh, recife)
   * @returns Lista de imoveis encontrados
   */
  async consultaCEP(cep: string, cidade: Cidade = 'sp'): Promise<Imovel[]> {
    const response = await this.makeRequest<Imovel[]>('GET', '/consulta/cep', {
      cep,
      cidade,
    });
    return Array.isArray(response) ? response : [];
  }

  /**
   * Consulta zoneamento por coordenadas.
   *
   * @param latitude - Latitude do ponto
   * @param longitude - Longitude do ponto
   * @returns Informacoes de zoneamento
   */
  async consultaZoneamento(
    latitude: number,
    longitude: number
  ): Promise<Zoneamento> {
    return this.makeRequest<Zoneamento>('GET', '/consulta/zoneamento', {
      lat: latitude,
      lng: longitude,
    });
  }

  // ==================== VALUATION ====================

  /**
   * Calcula estimativa de valor de mercado.
   * Requer plano Pro ou superior.
   *
   * @param params - Parametros da avaliacao
   * @returns Avaliacao de mercado
   */
  async valuationEstimate(params: ValuationParams): Promise<Valuation> {
    return this.makeRequest<Valuation>('GET', '/valuation/estimate', {
      area_terreno: params.areaTerreno,
      area_construida: params.areaConstruida,
      bairro: params.bairro,
      cidade: params.cidade || 'sp',
      zona: params.zona,
      tipo_uso: params.tipoUso,
      tipo_padrao: params.tipoPadrao,
      ano_construcao: params.anoConstrucao,
    });
  }

  /**
   * Busca imoveis comparaveis.
   * Requer plano Pro ou superior.
   *
   * @param params - Parametros da busca
   * @returns Lista de imoveis comparaveis
   */
  async valuationComparables(params: ComparablesParams): Promise<Comparavel[]> {
    const response = await this.makeRequest<Comparavel[]>(
      'GET',
      '/valuation/comparables',
      {
        bairro: params.bairro,
        area_min: params.areaMin,
        area_max: params.areaMax,
        cidade: params.cidade || 'sp',
        limit: params.limit || 10,
      }
    );
    return Array.isArray(response) ? response : [];
  }

  /**
   * Avalia imovel por endereco OU SQL.
   * Combina dados do modelo AVM (ML) com transacoes ITBI reais.
   * Requer plano Pro ou superior.
   *
   * @param params - Parametros da avaliacao (sql OU logradouro+numero)
   * @returns Avaliacao completa do imovel
   */
  async valuationEvaluate(params: EvaluateParams): Promise<PropertyEvaluation> {
    const body: Record<string, unknown> = {
      cidade: params.cidade || 'sp',
      incluirItbi: params.incluirItbi ?? true,
      incluirComparaveis: params.incluirComparaveis ?? true,
    };

    if (params.sql) {
      body.sql = params.sql;
    } else {
      if (params.logradouro) body.logradouro = params.logradouro;
      if (params.numero !== undefined) body.numero = params.numero;
      if (params.complemento) body.complemento = params.complemento;
      if (params.bairro) body.bairro = params.bairro;
    }

    return this.makeRequest<PropertyEvaluation>(
      'POST',
      '/valuation/evaluate',
      undefined,
      body
    );
  }

  // ==================== ITBI ====================

  /**
   * Consulta status de transacao ITBI.
   *
   * @param protocolo - Numero do protocolo ITBI
   * @param cidade - Codigo da cidade (sp, bh, recife)
   * @returns Status da transacao
   */
  async itbiStatus(
    protocolo: string,
    cidade: Cidade = 'sp'
  ): Promise<ITBIStatus> {
    return this.makeRequest<ITBIStatus>('GET', '/itbi/status', {
      protocolo,
      cidade,
    });
  }

  /**
   * Calcula valor do ITBI.
   *
   * @param params - Parametros do calculo
   * @returns Calculo do ITBI
   */
  async itbiCalcular(params: ITBICalculoParams): Promise<ITBICalculo> {
    return this.makeRequest<ITBICalculo>('POST', '/itbi/calcular', undefined, {
      sql: params.sql,
      valorTransacao: params.valorTransacao,
      cidade: params.cidade || 'sp',
    });
  }

  /**
   * Consulta historico de transacoes ITBI de um imovel.
   * Requer plano Starter ou superior.
   *
   * @param sql - Numero SQL do imovel
   * @param cidade - Codigo da cidade (sp, bh, recife)
   * @returns Lista de transacoes historicas
   */
  async itbiHistorico(
    sql: string,
    cidade: Cidade = 'sp'
  ): Promise<ITBIHistorico[]> {
    const response = await this.makeRequest<ITBIHistorico[]>(
      'GET',
      '/itbi/historico',
      { sql, cidade }
    );
    return Array.isArray(response) ? response : [];
  }

  /**
   * Consulta aliquotas ITBI vigentes.
   *
   * @param cidade - Codigo da cidade (sp, bh, recife)
   * @returns Aliquotas vigentes
   */
  async itbiAliquotas(cidade: Cidade = 'sp'): Promise<ITBIAliquota> {
    return this.makeRequest<ITBIAliquota>('GET', '/itbi/aliquotas', { cidade });
  }

  /**
   * Consulta isencoes ITBI disponiveis.
   *
   * @param cidade - Codigo da cidade (sp, bh, recife)
   * @returns Lista de isencoes disponiveis
   */
  async itbiIsencoes(cidade: Cidade = 'sp'): Promise<ITBIIsencao[]> {
    const response = await this.makeRequest<ITBIIsencao[]>(
      'GET',
      '/itbi/isencoes',
      { cidade }
    );
    return Array.isArray(response) ? response : [];
  }

  /**
   * Gera guia de pagamento ITBI.
   * Requer plano Starter ou superior.
   *
   * @param params - Parametros da guia
   * @returns Guia de pagamento gerada
   */
  async itbiGuia(params: ITBIGuiaParams): Promise<ITBIGuia> {
    return this.makeRequest<ITBIGuia>('POST', '/itbi/guia', undefined, {
      sql: params.sql,
      valorTransacao: params.valorTransacao,
      comprador: params.comprador,
      vendedor: params.vendedor,
      cidade: params.cidade || 'sp',
    });
  }

  /**
   * Valida autenticidade de uma guia ITBI.
   *
   * @param protocolo - Numero do protocolo da guia
   * @param cidade - Codigo da cidade (sp, bh, recife)
   * @returns Resultado da validacao
   */
  async itbiValidarGuia(
    protocolo: string,
    cidade: Cidade = 'sp'
  ): Promise<ITBIValidacao> {
    return this.makeRequest<ITBIValidacao>('GET', '/itbi/validar', {
      protocolo,
      cidade,
    });
  }

  /**
   * Simula calculo de ITBI.
   *
   * @param params - Parametros da simulacao
   * @returns Resultado da simulacao
   */
  async itbiSimular(params: ITBISimularParams): Promise<ITBISimulacao> {
    return this.makeRequest<ITBISimulacao>('POST', '/itbi/simular', undefined, {
      valorTransacao: params.valorTransacao,
      cidade: params.cidade || 'sp',
      tipoFinanciamento: params.tipoFinanciamento,
      valorFinanciado: params.valorFinanciado,
    });
  }
}
