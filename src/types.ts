/**
 * Tipos e interfaces para a IPTU API.
 */

// ==================== CONFIGURACAO ====================

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
}

export interface ClientConfig {
  baseUrl: string;
  timeout: number;
  retryConfig: RetryConfig;
}

export interface ClientOptions {
  baseUrl?: string;
  timeout?: number;
  retryConfig?: Partial<RetryConfig>;
}

// ==================== RATE LIMIT ====================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

// ==================== IMOVEL ====================

export interface Imovel {
  sql: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep?: string;
  areaTerreno?: number;
  areaConstruida?: number;
  valorVenal?: number;
  valorVenalTerreno?: number;
  valorVenalConstrucao?: number;
  anoConstrucao?: number;
  uso?: string;
  padrao?: string;
  testada?: number;
  fracaoIdeal?: number;
  quantidadePavimentos?: number;
}

// ==================== ZONEAMENTO ====================

export interface Zoneamento {
  zona: string;
  usoPermitido: string;
  coeficienteAproveitamento?: number;
  taxaOcupacao?: number;
  gabarito?: number;
  recuoFrontal?: number;
  legislacao?: string;
}

// ==================== VALUATION ====================

export interface Valuation {
  valorEstimado: number;
  valorMinimo: number;
  valorMaximo: number;
  confianca: number;
  valorM2: number;
  metodologia: string;
  dataReferencia: string;
}

export interface ValuationParams {
  areaTerreno: number;
  areaConstruida: number;
  bairro: string;
  cidade?: string;
  zona?: string;
  tipoUso?: string;
  tipoPadrao?: string;
  anoConstrucao?: number;
}

export interface Comparavel {
  sql: string;
  logradouro: string;
  bairro: string;
  areaConstruida: number;
  valorVenal: number;
  valorM2: number;
  distanciaKm?: number;
}

export interface ComparablesParams {
  bairro: string;
  areaMin: number;
  areaMax: number;
  cidade?: string;
  limit?: number;
}

// ==================== ITBI ====================

export interface ITBIStatus {
  protocolo: string;
  status: string;
  dataSolicitacao: string;
  valorTransacao: number;
  valorVenalReferencia: number;
  baseCalculo: number;
  aliquota: number;
  valorITBI: number;
  dataAprovacao?: string;
}

export interface ITBICalculo {
  sql: string;
  valorTransacao: number;
  valorVenalReferencia: number;
  baseCalculo: number;
  aliquota: number;
  valorITBI: number;
  isencaoAplicavel: boolean;
  fundamentacaoLegal: string;
}

export interface ITBICalculoParams {
  sql: string;
  valorTransacao: number;
  cidade?: string;
}

export interface ITBIHistorico {
  protocolo: string;
  dataTransacao: string;
  tipoTransacao: string;
  valorTransacao: number;
  valorITBI: number;
}

export interface ITBIAliquota {
  cidade: string;
  aliquotaPadrao: number;
  aliquotaFinanciamentoSFH: number;
  valorMinimoIsencao: number;
  baseLegal: string;
  vigencia: string;
}

export interface ITBIIsencao {
  tipo: string;
  descricao: string;
  requisitos: string[];
  baseLegal: string;
}

export interface Pessoa {
  nome: string;
  documento: string;
  email?: string;
}

export interface ITBIGuiaParams {
  sql: string;
  valorTransacao: number;
  comprador: Pessoa;
  vendedor: Pessoa;
  cidade?: string;
}

export interface ITBIGuia {
  protocolo: string;
  codigoBarras: string;
  linhaDigitavel: string;
  dataEmissao: string;
  dataVencimento: string;
  valorITBI: number;
}

export interface ITBIValidacao {
  protocolo: string;
  valido: boolean;
  pago: boolean;
  dataPagamento?: string;
  valorPago?: number;
}

export interface ITBISimularParams {
  valorTransacao: number;
  cidade?: string;
  tipoFinanciamento?: 'sfh' | 'nao_sfh';
  valorFinanciado?: number;
}

export interface ITBISimulacao {
  valorTransacao: number;
  valorFinanciado: number;
  valorNaoFinanciado: number;
  aliquotaSFH: number;
  aliquotaPadrao: number;
  valorITBIFinanciado: number;
  valorITBINaoFinanciado: number;
  valorITBITotal: number;
  economiaSFH: number;
}

// ==================== API RESPONSE ====================

export interface APIResponse<T> {
  success: boolean;
  data: T;
  metadata?: Record<string, unknown>;
}

// ==================== CIDADE ====================

export type Cidade = 'sp' | 'bh' | 'recife';
