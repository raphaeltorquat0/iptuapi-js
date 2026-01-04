/**
 * IPTU API - JavaScript/TypeScript SDK
 *
 * SDK oficial para integracao com a IPTU API.
 * Acesso a dados de IPTU e ITBI de Sao Paulo, Belo Horizonte e Recife.
 */

export { IPTUClient } from './client';

export {
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

export type {
  // Config
  RetryConfig,
  ClientConfig,
  ClientOptions,
  RateLimitInfo,
  // Models
  Imovel,
  Zoneamento,
  Valuation,
  ValuationParams,
  Comparavel,
  ComparablesParams,
  // AVM Evaluate
  EvaluateParams,
  AVMEstimate,
  ITBIMarketEstimate,
  FinalValuation,
  PropertyEvaluation,
  // ITBI
  ITBIStatus,
  ITBICalculo,
  ITBICalculoParams,
  ITBIHistorico,
  ITBIAliquota,
  ITBIIsencao,
  Pessoa,
  ITBIGuiaParams,
  ITBIGuia,
  ITBIValidacao,
  ITBISimularParams,
  ITBISimulacao,
  Cidade,
} from './types';
